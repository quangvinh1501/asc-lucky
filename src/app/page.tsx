"use client";
import ChannelGate from "@/components/ChannelGate";
import { useWebSocket } from "@/lib/useWebSocket";

function StartContent() {
  const channel = typeof window !== "undefined" ? localStorage.getItem("lucky_channel") : null;
  const { send } = useWebSocket(channel, () => {});

  const handleStart = () => {
    send({ type: "START_DRAW", roundId: "auto" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-900 via-yellow-900 to-red-900 gap-8">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-yellow-400 drop-shadow-lg tracking-widest">🎉 LUCKY DRAW 🎉</h1>
        <p className="text-yellow-200 mt-2 text-lg">Channel: <span className="font-bold text-white">{channel}</span></p>
      </div>

      <button
        onClick={handleStart}
        className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-gray-900 font-extrabold text-2xl px-16 py-5 rounded-full shadow-2xl transition-all"
      >
        🚀 Start
      </button>

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
