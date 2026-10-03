import { useEffect, useEffectEvent } from "react";

type EventSourceHandlers = {
  /** Parsed JSON `data` of each message (`unknown`: validate before use). */
  onMessage: (data: unknown) => void;
  /** Called when the connection is re-established after a drop: events may have been missed. */
  onReconnect?: () => void;
};

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Malformed frames are ignored rather than breaking the stream.
    return undefined;
  }
}

/**
 * Subscribes to a Server-Sent Events endpoint with the browser's native `EventSource` (automatic
 * reconnect, `Last-Event-ID`, same-origin cookies). Closes the connection on unmount.
 */
export function useEventSource(url: string, { onMessage, onReconnect }: EventSourceHandlers): void {
  const handleMessage = useEffectEvent(onMessage);
  const handleReconnect = useEffectEvent(() => onReconnect?.());

  useEffect(() => {
    const source = new EventSource(url);
    let connectedBefore = false;
    source.onopen = () => {
      if (connectedBefore) {
        handleReconnect();
      }
      connectedBefore = true;
    };
    source.onmessage = (event: MessageEvent<string>) => handleMessage(parseJson(event.data));
    return () => source.close();
  }, [url]);
}
