"use client";
import { useState, useEffect } from "react";
import ChannelGate from "@/components/ChannelGate";
import { useWebSocket } from "@/lib/useWebSocket";
import type { AppConfig, RoundConfig } from "@/lib/types";

function StartContent() {
  const channel = typeof window !== "undefined" ? localStorage.getItem("lucky_channel") : null;
  const [rounds, setRounds] = useState<RoundConfig[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>("");

  useEffect(() => {
    const cfg = localStorage.getItem("lucky_config");
    if (cfg) {
      const parsed: AppConfig = JSON.parse(cfg);
      setRounds(parsed.rounds || []);
      if (parsed.rounds?.length) setSelectedRound(parsed.rounds[0].id);
    }
  }, []);

  const { send } = useWebSocket(channel, () => {});

  const handleStart = () => {
    if (!selectedRound) return;
    send({ type: "START_DRAW", roundId: selectedRound });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-900 via-yellow-900 to-red-900 gap-8">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-yellow-400 drop-shadow-lg tracking-widest">🎉 LUCKY DRAW 🎉</h1>
        <p className="text-yellow-200 mt-2 text-lg">Channel: <span className="font-bold text-white">{channel}</span></p>
      </div>

      {rounds.length > 0 ? (
        <div className="flex flex-col items-center gap-4">
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="bg-gray-800 text-white px-6 py-3 rounded-xl border border-yellow-400 text-lg outline-none"
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} ({r.count} winner{r.count > 1 ? "s" : ""})
              </option>
            ))}
          </select>
          <button
            onClick={handleStart}
            className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-gray-900 font-extrabold text-2xl px-16 py-5 rounded-full shadow-2xl transition-all"
          >
            🚀 Start
          </button>
        </div>
      ) : (
        <div className="text-yellow-200 text-center">
          <p className="text-xl">No configuration found.</p>
          <a href="/admin" className="mt-4 underline text-yellow-400 text-lg">
            Go to Admin to configure
          </a>
        </div>
      )}

      <a href="/admin" className="text-yellow-500 underline text-sm">Admin</a>
    </div>
  );
}

export default function StartPage() {
  return (
    <ChannelGate>
      <StartContent />
    </ChannelGate>
  );
}
