"use client";
import { useEffect, useRef } from "react";
import type { Employee, AppConfig } from "@/lib/types";

interface Props {
  employees: Employee[];
  config: AppConfig;
  spinning: boolean;
  currentTarget: Employee | null;
  winners: Employee[];
  mascot?: string;
  mascotSize?: number;
}

const ANIMAL_EMOJI: Record<string, string> = {
  rat: "🐭", mouse: "🐭", ox: "🐮", cow: "🐮", buffalo: "🐃",
  tiger: "🐯", rabbit: "🐰", bunny: "🐰", dragon: "🐲",
  snake: "🐍", horse: "🐴", goat: "🐐", sheep: "🐑", ram: "🐏",
  monkey: "🐵", rooster: "🐓", chicken: "🐔", dog: "🐶",
  pig: "🐷", boar: "🐗", cat: "🐱", bear: "🐻", panda: "🐼",
  fox: "🦊", wolf: "🐺", lion: "🦁", elephant: "🐘", deer: "🦌",
  unicorn: "🦄", penguin: "🐧", duck: "🦆", eagle: "🦅", owl: "🦉",
  fish: "🐟", shark: "🦈", dolphin: "🐬", whale: "🐳", turtle: "🐢",
};

function getEmoji(mascot?: string): string {
  if (!mascot?.trim()) return "👤";
  return ANIMAL_EMOJI[mascot.trim().toLowerCase()] || "🐾";
}

interface Particle {
  emp: Employee;
  angle: number;
  radius: number;
  speed: number;
  scale: number;
  bobOffset: number;
  popped: boolean;
  popTimer: number;
  color: string;
}

const COLORS = ["#f59e0b","#ef4444","#3b82f6","#10b981","#8b5cf6","#f97316","#06b6d4","#ec4899"];

export default function LuckyCanvas({ employees, config, spinning, currentTarget, winners, mascot, mascotSize = 64 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    particles: [] as Particle[],
    frame: 0,
    spinning,
    currentTarget,
    winners,
    config,
    emoji: getEmoji(mascot),
    mascotSize,
  });

  useEffect(() => {
    const s = stateRef.current;
    s.spinning = spinning;
    s.winners = winners;
    s.config = config;
    s.emoji = getEmoji(mascot);
    s.mascotSize = mascotSize ?? 64;
    if (currentTarget) {
      s.currentTarget = currentTarget;
      const p = s.particles.find(p => p.emp[config.idColumn] === currentTarget[config.idColumn]);
      if (p) { p.popped = true; p.popTimer = 20; }
    }
  }, [spinning, currentTarget, winners, config, mascot]);

  useEffect(() => {
    if (!employees.length) return;
    stateRef.current.particles = employees.map((emp, i) => ({
      emp,
      angle: (i / employees.length) * Math.PI * 2,
      radius: 180 + Math.random() * 80,
      speed: (0.003 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1),
      scale: 1,
      bobOffset: Math.random() * Math.PI * 2,
      popped: false,
      popTimer: 0,
      color: COLORS[i % COLORS.length],
    }));
  }, [employees]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth || canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawPerson = (
      ctx: CanvasRenderingContext2D,
      x: number, y: number, scale: number,
      _color: string, empId: string, name: string,
      dimmed: boolean, popped: boolean,
      emoji: string, fontSize: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = dimmed ? 0.2 : 1;
      if (popped) { ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 24; }

      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, 0, 0);

      ctx.shadowBlur = 0;

      ctx.fillStyle = popped ? "#fbbf24" : "#9ca3af";
      ctx.font = `bold ${popped ? 12 : 9}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(empId, 0, -(fontSize / 2 + 10));

      if (popped) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(name.length > 16 ? name.slice(0, 15) + "…" : name, 0, fontSize / 2 + 16);
      }

      ctx.restore();
    };

    const loop = () => {
      const s = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      s.frame++;

      // orbit rings
      ctx.strokeStyle = "rgba(251,191,36,0.07)";
      ctx.lineWidth = 1;
      for (const r of [160, 220, 270]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const winnerIds = new Set(s.winners.map(w => w[s.config.idColumn]));
      const hasWinners = s.winners.length > 0;

      for (const p of s.particles) {
        if (s.spinning) p.angle += p.speed;
        const bob = Math.sin(s.frame * 0.05 + p.bobOffset) * 4;

        if (p.popTimer > 0) {
          p.popTimer--;
          p.scale = 1 + (p.popTimer / 20) * 1.2;
        } else {
          p.popped = false;
          p.scale += (1 - p.scale) * 0.1;
        }

        if (hasWinners && winnerIds.has(p.emp[s.config.idColumn])) {
          p.scale += (1.8 - p.scale) * 0.05;
        }

        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * p.radius + bob;
        const isWinner = winnerIds.has(p.emp[s.config.idColumn]);

        const empId = p.emp[s.config.idColumn] || "";
        // if nameColumn same as idColumn or empty, pick first other column
        const nameCol = (s.config.nameColumn && s.config.nameColumn !== s.config.idColumn)
          ? s.config.nameColumn
          : Object.keys(p.emp).find(k => k !== s.config.idColumn) || s.config.idColumn;
        const name = p.emp[nameCol] || "";

        drawPerson(ctx, px, py, p.scale, p.color,
          empId,
          name,
          hasWinners && !isWinner,
          p.popped || isWinner,
          s.emoji,
          s.mascotSize
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
