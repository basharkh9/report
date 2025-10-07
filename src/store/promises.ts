type AwaitableResult<T> =
  | { status: "fulfilled"; value: T; context: string }
  | { status: "rejected"; reason: unknown; context: string };

type AwaitableFn<T> = (() => Promise<AwaitableResult<T>>) & Awaitable<T>;

class Awaitable<T> {
  private factory: () => Promise<T>;
  private context: string;

  constructor(factory: () => Promise<T>, context: string) {
    this.factory = factory;
    this.context = context;

    // Make the instance callable
    const fn = (async () => this.run()).bind(this) as AwaitableFn<T>;
    Object.setPrototypeOf(fn, Awaitable.prototype);

    (fn as any).addContext = (extra: string) => {
      this.context += ` | ${extra}`;
      return fn;
    };
    (fn as any).run = this.run.bind(this);

    return fn;
  }

  addContext(extra: string) {
    this.context += ` | ${extra}`;
    return this;
  }

  async run(): Promise<AwaitableResult<T>> {
    console.log(`➡️ Starting: ${this.context}`);
    try {
      const value = await this.factory();
      console.log(`✅ Finished: ${this.context}`);
      return { status: "fulfilled", value, context: this.context };
    } catch (err) {
      console.log(`❌ Failed: ${this.context}`);
      return {
        status: "rejected",
        reason: err instanceof Error ? err.message : String(err),
        context: this.context
      };
    }
  }
}

// ----------------- Concurrency + Retry Handler -----------------
class PromiseHandler {
  constructor(private concurrency: number, private retryCount = 0) {}

  async all<T>(tasks: Awaitable<T>[]): Promise<T[]> {
    const results: T[] = [];
    await this.runWithConcurrency(tasks, async (res, idx) => {
      if (res.status === "fulfilled") {
        results[idx] = res.value;
      } else {
        throw res.reason; // stop immediately
      }
    });
    return results;
  }

  async allSettled<T>(tasks: Awaitable<T>[]): Promise<AwaitableResult<T>[]> {
    const results: AwaitableResult<T>[] = [];
    await this.runWithConcurrency(tasks, async (res, idx) => {
      results[idx] = res;
    });
    return results;
  }

  private async runWithConcurrency<T>(
    tasks: Awaitable<T>[],
    handle: (res: AwaitableResult<T>, idx: number) => Promise<void>
  ) {
    const executing: Promise<void>[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const a = tasks[i] as unknown as AwaitableFn<T>; // cast to callable
      const p = (async () => {
        const res = await this.runWithRetry(a, this.retryCount);
        await handle(res, i);
      })().finally(() => {
        const idx = executing.indexOf(p);
        if (idx > -1) executing.splice(idx, 1);
      });

      executing.push(p);
      if (executing.length >= this.concurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  }

  private async runWithRetry<T>(
    task: AwaitableFn<T>,
    retriesLeft: number
  ): Promise<AwaitableResult<T>> {
    let attempt = 0;
    while (true) {
      attempt++;
      const res = await task();
      if (res.status === "fulfilled") {
        if (attempt > 1)
          console.log(`🔁 Success after ${attempt} attempt(s): ${res.context}`);
        return res;
      }

      if (retriesLeft <= 0) {
        console.log(`❌ Exhausted retries for ${res.context}`);
        return res;
      }

      console.log(`🔁 Retry ${attempt} failed (${res.reason}). Retrying...`);
      retriesLeft--;
      await new Promise((r) => setTimeout(r, 300)); // small backoff
    }
  }
}

// ----------------- Example Usage -----------------
async function demo() {
  const factories = [
    new Awaitable(
      async () => {
        await new Promise(r => setTimeout(r, 800));
        return "Task 1 Done";
      },
      "Task 1"
    ).addContext("uniqueRef=A1"),

    new Awaitable(
      async () => {
        await new Promise(r => setTimeout(r, 16000));
        throw new Error("Boom in Task 2");
      },
      "Task 2"
    ).addContext("uniqueRef=B2"),

    new Awaitable(
      async () => {
        await new Promise(r => setTimeout(r, 100));
        return "Task 3 Done";
      },
      "Task 3"
    ).addContext("uniqueRef=C3"),
  ];

  // Create handler with concurrency 2 and retry count 2
  const handler = new PromiseHandler(2, 2);

  console.log("\n== Promise.allSettled with retries ==");
  const settled = await handler.allSettled(factories);
  console.log("Final result (allSettled):", settled);
}

demo();
