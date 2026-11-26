"use client";
import { useEffect, useRef, useCallback } from "react";
import PusherClient from "pusher-js";
import type { WSMessage } from "./types";

const USE_PUSHER = process.env.NEXT_PUBLIC_USE_PUSHER === "true";

export function useWebSocket(
  channel: string | null,
  onMessage: (msg: WSMessage) => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!channel) return;

    if (USE_PUSHER) {
      const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
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
    } else {
      // Native WebSocket mode (local dev)
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws?channel=${encodeURIComponent(channel)}`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as WSMessage;
          onMessageRef.current(msg);
        } catch {}
      };
      return () => ws.close();
    }
  }, [channel]);

  const send = useCallback((msg: WSMessage) => {
    const ch = localStorage.getItem("lucky_channel");
    if (!ch) return;

    if (USE_PUSHER) {
      fetch("/api/pusher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: ch, event: "message", data: msg }),
      });
    } else {
      // for local WS, re-use a shared ws instance via broadcast API
      fetch("/api/ws-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: ch, data: msg }),
      });
    }
  }, []);

  return { send };
}
