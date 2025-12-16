import WebSocket from "ws";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// --------------------------------------
// TRANSCRIPT STORAGE
// --------------------------------------

interface TranscriptEntry {
    speaker: "agent" | "customer";
    startMs: number;   // from start of audio
    endMs: number;     // from start of audio
    text: string;
}

const transcriptLog: TranscriptEntry[] = [];

let conversationStartMs: number | null = null; // earliest startMs
let conversationEndMs: number | null = null;   // latest endMs

function updateConversationBounds(startMs: number, endMs: number) {
    if (conversationStartMs === null || startMs < conversationStartMs) {
        conversationStartMs = startMs;
    }
    if (conversationEndMs === null || endMs > conversationEndMs) {
        conversationEndMs = endMs;
    }
}

function formatTimestamp(ms: number): string {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60);
    const msRemain = ms % 1000;

    return (
        String(hrs).padStart(2, "0") + ":" +
        String(min % 60).padStart(2, "0") + ":" +
        String(sec % 60).padStart(2, "0") + "." +
        String(msRemain).padStart(3, "0")
    );
}

function printMergedTranscript() {
    // sort by startMs
    const ordered = [...transcriptLog].sort((a, b) => a.startMs - b.startMs);

    console.clear();
    console.log("====== Merged Transcript (relative ms) ======\n");

    for (const e of ordered) {
        console.log(
            `${formatTimestamp(e.startMs)} – ${formatTimestamp(e.endMs)}  ${e.speaker}: ${e.text}`
        );
    }

    if (conversationStartMs !== null && conversationEndMs !== null) {
        console.log("\nConversation bounds (ms from start of audio):");
        console.log("  conversationStartMs:", conversationStartMs);
        console.log("  conversationEndMs  :", conversationEndMs);
        console.log("  durationMs         :", conversationEndMs - conversationStartMs);
    }
}

// --------------------------------------
// Azure Speech Recognizers
// --------------------------------------

const speechKey = process.env.AZURE_KEY;
const speechRegion = process.env.AZURE_REGION;

// 8000 Hz, 8-bit, mono, µ-law (Genesys AudioHook)
const audioFormat = sdk.AudioStreamFormat.getWaveFormat(
    8000,
    8,
    1,
    sdk.AudioFormatTag.MuLaw
);

const agentPushStream = sdk.AudioInputStream.createPushStream(audioFormat);
const customerPushStream = sdk.AudioInputStream.createPushStream(audioFormat);

const agentAudioConfig = sdk.AudioConfig.fromStreamInput(agentPushStream);
const customerAudioConfig = sdk.AudioConfig.fromStreamInput(customerPushStream);

// Use Detailed output so offset/duration are populated properly
const baseSpeechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
baseSpeechConfig.speechRecognitionLanguage = "en-US";
baseSpeechConfig.outputFormat = sdk.OutputFormat.Detailed;

// helper to clone config (JS SDK reuses same instance; safe to reuse as well,
// but we create two independent recognizers with same config)
function createSpeechConfig(): sdk.SpeechConfig {
    const cfg = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    cfg.speechRecognitionLanguage = baseSpeechConfig.speechRecognitionLanguage;
    cfg.outputFormat = baseSpeechConfig.outputFormat;
    return cfg;
}

const agentRecognizer = new sdk.SpeechRecognizer(
    createSpeechConfig(),
    agentAudioConfig
);

const customerRecognizer = new sdk.SpeechRecognizer(
    createSpeechConfig(),
    customerAudioConfig
);

// ticks (100-ns) → ms
const ticksToMs = (ticks: number): number => ticks / 10_000;

// --------------------------------------
// START continuous STT
// --------------------------------------

agentRecognizer.startContinuousRecognitionAsync();
customerRecognizer.startContinuousRecognitionAsync();

// -------------------------
// Agent Events
// -------------------------
agentRecognizer.recognized = (_, e) => {
    if (!e.result || !e.result.text) return;

    const offsetMs = ticksToMs(e.result.offset);     // from start of audio
    const durationMs = ticksToMs(e.result.duration);
    const startMs = offsetMs;
    const endMs = offsetMs + durationMs;

    const entry: TranscriptEntry = {
        speaker: "agent",
        startMs,
        endMs,
        text: e.result.text
    };

    transcriptLog.push(entry);
    updateConversationBounds(startMs, endMs);

    printMergedTranscript();
};

// (optional) partials just log; we don't store them
agentRecognizer.recognizing = (_, e) => {
    if (!e.result || !e.result.text) return;
    // You can log partials if you want:
    // console.log(`(partial agent) ${e.result.text}`);
};

// -------------------------
// Customer Events
// -------------------------
customerRecognizer.recognized = (_, e) => {
    if (!e.result || !e.result.text) return;

    const offsetMs = ticksToMs(e.result.offset);
    const durationMs = ticksToMs(e.result.duration);
    const startMs = offsetMs;
    const endMs = offsetMs + durationMs;

    const entry: TranscriptEntry = {
        speaker: "customer",
        startMs,
        endMs,
        text: e.result.text
    };

    transcriptLog.push(entry);
    updateConversationBounds(startMs, endMs);

    printMergedTranscript();
};

customerRecognizer.recognizing = (_, e) => {
    if (!e.result || !e.result.text) return;
    // console.log(`(partial customer) ${e.result.text}`);
};

// --------------------------------------
// Genesys AudioHook WebSocket Server
// --------------------------------------

const ws = new WebSocket.Server({ port: 8080 });
console.log("Listening on ws://localhost:8080");

ws.on("connection", (socket) => {
    console.log("AudioHook connected");

    socket.on("message", (data, isBinary) => {
        if (!isBinary) {
            // JSON control message
            const msg = JSON.parse(data.toString());

            if (msg.type === "open") {
                // Required handshake — request both channels
                socket.send(
                    JSON.stringify({
                        type: "opened",
                        channels: ["external", "internal"]
                    })
                );
            }

            return;
        }

        // -----------------------------
        // Binary audio (stereo µ-law)
        // -----------------------------
        const frame = Buffer.from(data);

        // Byte pattern: [L(agent), R(customer), L, R, L, R, ...]
        const agentBuf = Buffer.alloc(frame.length / 2);
        const customerBuf = Buffer.alloc(frame.length / 2);

        let ai = 0;
        let ci = 0;

        for (let i = 0; i < frame.length; i += 2) {
            agentBuf[ai++] = frame[i];       // left
            customerBuf[ci++] = frame[i + 1]; // right
        }

        agentPushStream.write(agentBuf);
        customerPushStream.write(customerBuf);
    });

    socket.on("close", () => {
        console.log("AudioHook disconnected");

        agentPushStream.close();
        customerPushStream.close();

        agentRecognizer.stopContinuousRecognitionAsync();
        customerRecognizer.stopContinuousRecognitionAsync();

        console.log("\n===== FINAL TRANSCRIPT JSON =====");
        console.log(JSON.stringify({
            conversationStartMs,
            conversationEndMs,
            durationMs: conversationStartMs !== null && conversationEndMs !== null
                ? conversationEndMs - conversationStartMs
                : null,
            entries: transcriptLog.sort((a, b) => a.startMs - b.startMs)
        }, null, 2));
    });
});

interface TranscriptEntry {
  speaker: "agent" | "customer";
  startMs: number;
  endMs: number;
  text: string;
}

function msToHhMmSs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return (
    String(h).padStart(2, "0") + ":" +
    String(m).padStart(2, "0") + ":" +
    String(s).padStart(2, "0")
  );
}

export function formatTranscriptTimerBased(entries: TranscriptEntry[]): string {
  const ordered = [...entries].sort((a, b) => a.startMs - b.startMs);

  return ordered
    .map(e => {
      const start = msToHhMmSs(e.startMs);
      const end = msToHhMmSs(e.endMs);
      const speaker = e.speaker;
      const text = (e.text ?? "").trim();

      return `[[${start} - ${end}]] ${speaker}: ${text}`;
    })
    .join("\n");
}
