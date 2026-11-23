"use client";
import { useState, useEffect, useRef } from "react";
import ChannelGate from "@/components/ChannelGate";
import LuckyCanvas from "@/components/LuckyCanvas";
import ThanTai from "@/components/ThanTai";
import { useWebSocket } from "@/lib/useWebSocket";
import type { Employee, WSMessage, AppConfig, WinnerRecord } from "@/lib/types";

const DEFAULT_CONFIG: AppConfig = { nameColumn: "fullname", idColumn: "employeeid", displayColumns: [], rounds: [] };

function GameContent() {
  const channel = typeof window !== "undefined" ? localStorage.getItem("lucky_channel") : null;
  const [spinning, setSpinning] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<Employee | null>(null);
  const [winners, setWinners] = useState<Employee[]>([]);
  const [roundLabel, setRoundLabel] = useState("");
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const cfg = localStorage.getItem("lucky_config");
    if (cfg) setConfig(JSON.parse(cfg));
    const emp = localStorage.getItem("lucky_employees");
    if (emp) setEmployees(JSON.parse(emp));
  }, []);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/xoso.m4a");
    audioRef.current.loop = true;
  }, []);

  const unlockAudio = () => {
    if (audioUnlocked) return;
    // silent play/pause to unlock autoplay policy
    const a = audioRef.current;
    if (!a) return;
    a.play().then(() => { a.pause(); a.currentTime = 0; setAudioUnlocked(true); }).catch(() => {});
  };

  const stopSpin = (finalWinners: Employee[], label: string, saveHistory = false) => {
    if (spinRef.current) clearInterval(spinRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setSpinning(false);
    setCurrentTarget(null);
    setWinners(finalWinners);
    setRoundLabel(label);
    if (saveHistory) {
      const history: WinnerRecord[] = JSON.parse(localStorage.getItem("lucky_history") || "[]");
      history.push({ round: history.length + 1, roundLabel: label, winners: finalWinners, timestamp: Date.now() });
      localStorage.setItem("lucky_history", JSON.stringify(history));
    }
  };

  const startSpin = (pool: Employee[]) => {
    setSpinning(true);
    setWinners([]);
    audioRef.current?.play().catch(() => {});
    let i = 0;
    spinRef.current = setInterval(() => {
      setCurrentTarget(pool[i % pool.length]);
      i++;
    }, 100);
  };

  const { send } = useWebSocket(channel, (msg: WSMessage) => {
    if (msg.type === "START_DRAW") {
      const cfg: AppConfig = JSON.parse(localStorage.getItem("lucky_config") || "{}");
      const emp: Employee[] = JSON.parse(localStorage.getItem("lucky_employees") || "[]");
      const history: WinnerRecord[] = JSON.parse(localStorage.getItem("lucky_history") || "[]");
      const alreadyWon = new Set(history.flatMap((h) => h.winners.map((w) => w[cfg.idColumn])));
      const pool = emp.filter((e) => !alreadyWon.has(e[cfg.idColumn]));
      const round = cfg.rounds?.find((r) => r.id === msg.roundId);
      if (!round || pool.length === 0) return;

      const count = Math.min(round.count, pool.length);
      const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

      startSpin(pool);
      send({ type: "SPINNING", candidates: pool });

      setTimeout(() => {
        stopSpin(picked, round.label, true);
        send({ type: "DRAW_RESULT", roundId: round.id, roundLabel: round.label, winners: picked });
      }, 10000);
    }

    if (msg.type === "DRAW_RESULT") stopSpin(msg.winners, msg.roundLabel, false);
    if (msg.type === "SPINNING") startSpin(msg.candidates);
    if (msg.type === "RESET") { setWinners([]); setCurrentTarget(null); setSpinning(false); }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-yellow-950 flex flex-col" style={{ height: "100dvh" }} onClick={unlockAudio}>
      {/* Header */}
      <div className="text-center pt-6 pb-2">
        <h1 className="text-4xl font-extrabold text-yellow-400 tracking-widest drop-shadow">🎊 LUCKY DRAW 🎊</h1>
        {spinning && <p className="text-yellow-300 animate-pulse mt-1">Đang quay số...</p>}
        {!spinning && winners.length > 0 && (
          <p className="text-yellow-300 font-bold mt-1 text-xl">🏆 {roundLabel}</p>
        )}
        {!spinning && winners.length === 0 && (
          <p className="text-yellow-600 mt-1 text-sm">
            {audioUnlocked ? "Chờ lệnh từ Start page..." : "👆 Click vào màn hình để bật âm thanh"}
          </p>
        )}
      </div>

      {/* Canvas + ThanTai overlay */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {employees.length > 0 ? (
          <>
            <LuckyCanvas
              employees={employees}
              config={config}
              spinning={spinning}
              currentTarget={currentTarget}
              winners={winners}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <ThanTai size={180} spinning={spinning} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-yellow-600">
            Chưa có danh sách nhân viên. Vào Admin để upload.
          </div>
        )}
      </div>

      {/* Winner cards */}
      {!spinning && winners.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 p-6">
          {winners.map((w, i) => (
            <div key={i} className="bg-yellow-400 rounded-2xl px-6 py-4 flex flex-col items-center shadow-2xl border-4 border-yellow-200 animate-bounce">
              <div className="text-3xl mb-1">🎉</div>
              <div className="text-gray-900 font-extrabold text-lg text-center">{w[config.nameColumn]}</div>
              <div className="text-gray-700 text-sm">{w[config.idColumn]}</div>
              {config.displayColumns.filter(c => c !== config.nameColumn && c !== config.idColumn).map(col => (
                <div key={col} className="text-gray-600 text-xs mt-0.5">{col}: {w[col]}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <ChannelGate>
      <GameContent />
    </ChannelGate>
  );
}
