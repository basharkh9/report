// src/store/sseMiddleware.ts
import { Middleware } from 'redux';
import { RootState } from './store';

// Action types
const START_SSE    = 'SSE/START';
const SSE_OPEN     = 'SSE/OPEN';
const SSE_MESSAGE  = 'SSE/MESSAGE';
const SSE_ERROR    = 'SSE/ERROR';
const STOP_SSE     = 'SSE/STOP';

// Action creators
export const startSse    = () => ({ type: START_SSE } as const);
export const stopSse     = () => ({ type: STOP_SSE } as const);
export const sseOpen     = () => ({ type: SSE_OPEN } as const);
export const sseMessage  = (payload: any) => ({ type: SSE_MESSAGE, payload } as const);
export const sseError    = (error: any) => ({ type: SSE_ERROR, error } as const);

type SseActions =
  | ReturnType<typeof startSse>
  | ReturnType<typeof stopSse>
  | ReturnType<typeof sseOpen>
  | ReturnType<typeof sseMessage>
  | ReturnType<typeof sseError>;

export const sseMiddleware: Middleware<{}, RootState> = storeAPI => {
  let es: EventSource | null = null;

  return next => (action: SseActions) => {
    switch (action.type) {
      case START_SSE:
        if (!es) {
          es = new EventSource('/api/stream');
          es.onopen = () => storeAPI.dispatch(sseOpen());
          es.onmessage = e => {
            const data = JSON.parse(e.data);
            storeAPI.dispatch(sseMessage(data));
          };
          es.onerror = err => {
            storeAPI.dispatch(sseError(err));
            // optionally close or retry
            es?.close();
            es = null;
          };
        }
        break;

      case STOP_SSE:
        es?.close();
        es = null;
        break;
    }

    return next(action);
  };
};
