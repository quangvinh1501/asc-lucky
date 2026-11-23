"use client";
import { useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import type { WSMessage } from "./types";

export function useWebSocket(
  channel: string | null,
  onMessage: (msg: WSMessage) => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!channel) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const ch = pusher.subscribe(`lucky-${channel}`);
    ch.bind("message", (data: WSMessage) => {
      onMessageRef.current(data);
    });
    return () => {
      ch.unbind_all();
      pusher.unsubscribe(`lucky-${channel}`);
      pusher.disconnect();
    };
  }, [channel]);

  const send = useCallback((msg: WSMessage) => {
    const channel = localStorage.getItem("lucky_channel");
    if (!channel) return;
    fetch("/api/pusher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, event: "message", data: msg }),
    });
  }, []);

  return { send };
}
