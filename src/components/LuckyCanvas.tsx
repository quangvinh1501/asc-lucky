"use client";
import { useEffect, useRef } from "react";
import type { Employee, AppConfig } from "@/lib/types";

interface Props {
  employees: Employee[];
  config: AppConfig;
  spinning: boolean;
  currentTarget: Employee | null;
  winners: Employee[];
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

export default function LuckyCanvas({ employees, config, spinning, currentTarget, winners }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    particles: [] as Particle[],
    frame: 0,
    spinning,
    currentTarget,
    winners,
    config,
  });

  useEffect(() => {
    const s = stateRef.current;
    s.spinning = spinning;
    s.winners = winners;
    s.config = config;
    if (currentTarget) {
      s.currentTarget = currentTarget;
      const p = s.particles.find(p => p.emp[config.idColumn] === currentTarget[config.idColumn]);
      if (p) { p.popped = true; p.popTimer = 20; }
    }
  }, [spinning, currentTarget, winners, config]);

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
      color: string, name: string, empId: string,
      dimmed: boolean, popped: boolean
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = dimmed ? 0.2 : 1;
      if (popped) { ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 24; }

      // body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-9, 2, 18, 28, 4);
      ctx.fill();

      // head
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(0, -4, 10, 0, Math.PI * 2);
      ctx.fill();

      // eyes
      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.arc(-3, -5, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // smile
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -2, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // legs
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-4, 30); ctx.lineTo(-6, 44);
      ctx.moveTo(4, 30); ctx.lineTo(6, 44);
      ctx.stroke();

      // arms
      ctx.beginPath();
      ctx.moveTo(-9, 10); ctx.lineTo(-18, 20);
      ctx.moveTo(9, 10); ctx.lineTo(18, 20);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // emp id above head
      ctx.fillStyle = popped ? "#fbbf24" : "#d1d5db";
      ctx.font = `bold ${popped ? 11 : 9}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(empId, 0, -18);

      // name when popped/winner
      if (popped) {
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(name.length > 14 ? name.slice(0, 13) + "…" : name, 0, 60);
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

        drawPerson(ctx, px, py, p.scale, p.color,
          p.emp[s.config.nameColumn] || "",
          p.emp[s.config.idColumn] || "",
          hasWinners && !isWinner,
          p.popped || isWinner
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
