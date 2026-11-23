"use client";
import { useState, useEffect } from "react";

export function useChannel() {
  const [channel, setChannel] = useState<string | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("lucky_channel");
    if (saved) setChannel(saved);
  }, []);

  const confirm = () => {
    if (!input.trim()) return;
    localStorage.setItem("lucky_channel", input.trim());
    setChannel(input.trim());
  };

  return { channel, input, setInput, confirm };
}

export default function ChannelGate({ children }: { children: React.ReactNode }) {
  const { channel, input, setInput, confirm } = useChannel();

  if (!channel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col gap-4 w-80">
          <h2 className="text-white text-xl font-bold text-center">Nhập Channel Name</h2>
          <input
            className="rounded-lg px-4 py-2 bg-gray-700 text-white outline-none border border-gray-600 focus:border-yellow-400"
            placeholder="VD: lucky-2025"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
          />
          <button
            onClick={confirm}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-2 rounded-lg transition"
          >
            Xác nhận
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
