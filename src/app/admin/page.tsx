"use client";
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import ChannelGate from "@/components/ChannelGate";
import { useWebSocket } from "@/lib/useWebSocket";
import type { AppConfig, Employee, RoundConfig, WinnerRecord } from "@/lib/types";

const DEFAULT_CONFIG: AppConfig = {
  nameColumn: "",
  idColumn: "",
  displayColumns: [],
  rounds: [],
};

function AdminContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<WinnerRecord[]>([]);
  const [saved, setSaved] = useState(false);
  const [bgImage, setBgImage] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const channel = typeof window !== "undefined" ? localStorage.getItem("lucky_channel") : "";

  useWebSocket(channel, (msg) => {
    if (msg.type === "DRAW_RESULT") {
      const updated: WinnerRecord[] = JSON.parse(localStorage.getItem("lucky_history") || "[]");
      setHistory([...updated]);
    }
  });

  useEffect(() => {
    const cfg = localStorage.getItem("lucky_config");
    if (cfg) setConfig(JSON.parse(cfg));
    const emp = localStorage.getItem("lucky_employees");
    if (emp) {
      const parsed: Employee[] = JSON.parse(emp);
      setEmployees(parsed);
      if (parsed.length) setColumns(Object.keys(parsed[0]));
    }
    const hist = localStorage.getItem("lucky_history");
    if (hist) setHistory(JSON.parse(hist));
    const bg = localStorage.getItem("lucky_bg");
    if (bg) setBgImage(bg);
    const title = localStorage.getItem("lucky_title");
    if (title) setEventTitle(title);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Employee[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      setEmployees(rows);
      if (rows.length) setColumns(Object.keys(rows[0]));
      localStorage.setItem("lucky_employees", JSON.stringify(rows));
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleDisplayCol = (col: string) => {
    setConfig((prev) => ({
      ...prev,
      displayColumns: prev.displayColumns.includes(col)
        ? prev.displayColumns.filter((c) => c !== col)
        : [...prev.displayColumns, col],
    }));
  };

  const addRound = () => {
    setConfig((prev) => ({
      ...prev,
      rounds: [...prev.rounds, { id: uuidv4(), label: `Round ${prev.rounds.length + 1}`, count: 1 }],
    }));
  };

  const updateRound = (id: string, field: keyof RoundConfig, value: string | number) => {
    setConfig((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
  };

  const removeRound = (id: string) => {
    setConfig((prev) => ({ ...prev, rounds: prev.rounds.filter((r) => r.id !== id) }));
  };

  const saveConfig = () => {
    localStorage.setItem("lucky_config", JSON.stringify(config));
    localStorage.setItem("lucky_bg", bgImage.trim());
    localStorage.setItem("lucky_title", eventTitle.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearHistory = () => {
    localStorage.removeItem("lucky_history");
    setHistory([]);
  };

  const exportHistory = () => {
    if (!history.length) return;
    const rows = history.flatMap((h) =>
      h.winners.map((w) => ({ Round: h.roundLabel, "Time": new Date(h.timestamp).toLocaleString(), ...w }))
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "lucky_draw_results.xlsx");
  };

  const exportEmployees = () => {
    if (!employees.length) return;
    const ws = XLSX.utils.json_to_sheet(employees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách");
    XLSX.writeFile(wb, "employees.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-yellow-400">⚙️ Admin</h1>
        <span className="text-gray-400 text-sm">Channel: <span className="text-white font-bold">{channel}</span></span>
      </div>

      {/* Upload Excel */}
      <section className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-yellow-300">📂 Upload Employee List</h2>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => fileRef.current?.click()} className="bg-yellow-400 text-gray-900 font-bold px-5 py-2 rounded-lg hover:bg-yellow-300 transition">
            Choose Excel File
          </button>
          {employees.length > 0 && (
            <button onClick={exportEmployees} className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-500 transition">
              Export Excel
            </button>
          )}
        </div>
        {employees.length > 0 && (
          <p className="text-green-400 text-sm">✅ Loaded {employees.length} employees | Columns: {columns.join(", ")}</p>
        )}
      </section>

      {/* Column config */}
      {columns.length > 0 && (
        <section className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-yellow-300">🗂️ Column Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Full Name column (required)</label>
              <select value={config.nameColumn} onChange={(e) => setConfig((p) => ({ ...p, nameColumn: e.target.value }))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 outline-none">
                <option value="">-- Select --</option>
                {columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Employee ID column (required)</label>
              <select value={config.idColumn} onChange={(e) => setConfig((p) => ({ ...p, idColumn: e.target.value }))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 outline-none">
                <option value="">-- Select --</option>
                {columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Extra columns to display on screen</label>
            <div className="flex flex-wrap gap-2">
              {columns.map((c) => (
                <button key={c} onClick={() => toggleDisplayCol(c)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${config.displayColumns.includes(c) ? "bg-yellow-400 text-gray-900 border-yellow-400" : "bg-gray-700 text-gray-300 border-gray-600 hover:border-yellow-400"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Round config */}
      <section className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-yellow-300">🎯 Round Configuration</h2>
        {config.rounds.map((r) => (
          <div key={r.id} className="flex gap-3 items-center flex-wrap">
            <input value={r.label} onChange={(e) => updateRound(r.id, "label", e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 outline-none flex-1 min-w-32"
              placeholder="Round name" />
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm whitespace-nowrap">Winners:</label>
              <input type="number" min={1} value={r.count} onChange={(e) => updateRound(r.id, "count", parseInt(e.target.value) || 1)}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 outline-none w-20 text-center" />
            </div>
            <button onClick={() => removeRound(r.id)} className="text-red-400 hover:text-red-300 text-xl px-2">✕</button>
          </div>
        ))}
        <button onClick={addRound} className="bg-gray-700 hover:bg-gray-600 text-yellow-400 font-bold px-4 py-2 rounded-lg border border-dashed border-yellow-600 transition w-fit">
          + Add Round
        </button>
      </section>

      {/* Background image */}
      <section className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-yellow-300">🎉 Event Title</h2>
        <input
          type="text"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          placeholder="e.g. ASC Year End Party 2025"
          className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 outline-none focus:border-yellow-400"
        />
        {!eventTitle && <p className="text-gray-500 text-sm">Leave empty to use default: LUCKY DRAW</p>}
      </section>

      {/* Background image */}
      <section className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-yellow-300">🖼️ Game Screen Background</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="text"
            value={bgImage}
            onChange={(e) => setBgImage(e.target.value)}
            placeholder="https://example.com/background.jpg"
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 outline-none focus:border-yellow-400 min-w-0"
          />
          {bgImage && (
            <button onClick={() => setBgImage("")} className="text-red-400 hover:text-red-300 px-2 text-xl">✕</button>
          )}
        </div>
        {bgImage && (
          <img src={bgImage} alt="preview" className="rounded-xl max-h-40 object-cover w-full" onError={(e) => (e.currentTarget.style.display = "none")} />
        )}
        {!bgImage && <p className="text-gray-500 text-sm">Leave empty to use the default background color.</p>}
      </section>

      <button onClick={saveConfig} className={`font-extrabold text-lg py-3 rounded-xl transition ${saved ? "bg-green-500 text-white" : "bg-yellow-400 hover:bg-yellow-300 text-gray-900"}`}>
        {saved ? "✅ Saved!" : "💾 Save Configuration"}
      </button>

      {/* History */}
      <section className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold text-yellow-300">📋 Winner History</h2>
          <div className="flex gap-2">
            <button onClick={exportHistory} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm transition">
              Export Excel
            </button>
            <button onClick={clearHistory} className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition">
              Clear History
            </button>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="text-gray-500">No results yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((h, i) => (
              <div key={i} className="bg-gray-700 rounded-xl p-4">
                <div className="text-yellow-300 font-bold mb-2">🏆 {h.roundLabel} — {new Date(h.timestamp).toLocaleString()}</div>
                <div className="flex flex-wrap gap-2">
                  {h.winners.map((w, j) => (
                    <div key={j} className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                      {w[config.nameColumn] || Object.values(w)[0]} ({w[config.idColumn] || Object.values(w)[1]})
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ChannelGate>
      <AdminContent />
    </ChannelGate>
  );
}
