// Cross-tab messages: when one tab changes data (or logs out), the other open tabs of the same origin find out.
// BroadcastChannel delivers a message to every OTHER same-origin context listening on the channel name,
// never to the sender itself, so a tab doesn't react to its own changes twice.

/** Everything a tab can announce. A discriminated union: receivers switch on `type` (06.06). */
export type CrossTabMessage =
  | { type: 'taskChanged'; taskId: number }
  | { type: 'tasksChanged' } // several at once (bulk delete, clear completed)
  | { type: 'loggedOut' };

const CHANNEL_NAME = 'taskflow';

function isCrossTabMessage(value: unknown): value is CrossTabMessage {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  switch (value.type) {
    case 'taskChanged':
      return 'taskId' in value && typeof value.taskId === 'number';
    case 'tasksChanged':
    case 'loggedOut':
      return true;
    default:
      return false;
  }
}

/** Old browsers and some test environments have no BroadcastChannel: then cross-tab sync is simply off. */
const supported = typeof BroadcastChannel !== 'undefined';

let sender: BroadcastChannel | null = null;

export function announce(message: CrossTabMessage): void {
  if (!supported) return;
  sender ??= new BroadcastChannel(CHANNEL_NAME);
  sender.postMessage(message);
}

/**
 * Listens until the returned function is called. Messages are UNTRUSTED input like any other: another tab
 * could run a different (older) version of the app, so each one is validated before use.
 */
export function listen(onMessage: (message: CrossTabMessage) => void): () => void {
  if (!supported) return () => undefined;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (isCrossTabMessage(event.data)) onMessage(event.data);
  };
  return () => channel.close();
}
