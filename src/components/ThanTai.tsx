"use client";

type Props = {
  size?: number;
  spinning?: boolean;
};

export default function ThanTai({ size = 220, spinning = false }: Props) {
  const speed = spinning ? "0.45s" : "1.1s";

  return (
    <svg
      viewBox="0 0 200 260"
      width={size}
      height={size * 1.3}
      style={{ ["--tap" as string]: speed, overflow: "visible" } as React.CSSProperties}
    >
      <style>{`
        .tt-body   { animation: tt-bob var(--tap) ease-in-out infinite;
                     transform-box: view-box; transform-origin: 100px 240px; }
        .tt-arm    { animation: tt-tap var(--tap) cubic-bezier(.5,0,.3,1) infinite;
                     transform-box: view-box; transform-origin: 128px 128px; }
        .tt-beard  { animation: tt-sway 2.4s ease-in-out infinite;
                     transform-box: view-box; transform-origin: 100px 108px; }
        .tt-wingL  { animation: tt-wingL var(--tap) ease-in-out infinite;
                     transform-box: view-box; transform-origin: 78px 58px; }
        .tt-wingR  { animation: tt-wingR var(--tap) ease-in-out infinite;
                     transform-box: view-box; transform-origin: 122px 58px; }
        .tt-eyes   { animation: tt-blink 4s infinite;
                     transform-box: view-box; transform-origin: 100px 84px; }
        .tt-spark  { animation: tt-spark var(--tap) ease-out infinite; opacity: 0;
                     transform-box: view-box; transform-origin: 182px 200px; }
        .tt-coin   { animation: tt-coin var(--tap) ease-out infinite; opacity: 0; }
        .tt-coin.c2 { animation-name: tt-coin2; }
        .tt-coin.c3 { animation-name: tt-coin3; }

        @keyframes tt-tap {
          0%   { transform: rotate(-38deg); }
          55%  { transform: rotate(6deg); }
          65%  { transform: rotate(0deg); }
          100% { transform: rotate(-38deg); }
        }
        @keyframes tt-bob {
          0%,100% { transform: translateY(0) scale(1,1); }
          55%     { transform: translateY(3px) scale(1.03,.97); }
        }
        @keyframes tt-sway {
          0%,100% { transform: rotate(-4deg); }
          50%     { transform: rotate(4deg); }
        }
        @keyframes tt-wingL { 0%,100%{transform:rotate(0)} 55%{transform:rotate(-12deg)} }
        @keyframes tt-wingR { 0%,100%{transform:rotate(0)} 55%{transform:rotate(12deg)} }
        @keyframes tt-blink {
          0%,92%,100% { transform: scaleY(1); }
          95%         { transform: scaleY(.1); }
        }
        @keyframes tt-spark {
          0%,50% { opacity:0; transform: scale(.2); }
          58%    { opacity:1; transform: scale(1.2); }
          80%    { opacity:0; transform: scale(1.6); }
          100%   { opacity:0; }
        }
        @keyframes tt-coin  { 0%,52%{opacity:0;transform:translate(0,0)} 60%{opacity:1}
                              100%{opacity:0;transform:translate(22px,-40px)} }
        @keyframes tt-coin2 { 0%,52%{opacity:0;transform:translate(0,0)} 60%{opacity:1}
                              100%{opacity:0;transform:translate(-8px,-50px)} }
        @keyframes tt-coin3 { 0%,52%{opacity:0;transform:translate(0,0)} 60%{opacity:1}
                              100%{opacity:0;transform:translate(34px,-18px)} }
      `}</style>

      <ellipse cx="100" cy="248" rx="48" ry="7" fill="rgba(0,0,0,.3)" />

      <g className="tt-body">
        <path d="M68 120 Q100 110 132 120 L150 242 L50 242 Z" fill="#d62828" />
        <path d="M100 118 L100 242" stroke="#f6c945" strokeWidth="4" />
        <rect x="62" y="160" width="76" height="10" rx="4" fill="#f6c945" />
        <circle cx="100" cy="165" r="8" fill="#ffdf6b" stroke="#b8860b" strokeWidth="2" />
        <path d="M50 242 L150 242" stroke="#f6c945" strokeWidth="6" />

        <path d="M70 126 Q56 150 78 162" stroke="#d62828" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M68 154 h26 l-4 10 h-18 z" fill="#ffd34d" stroke="#b8860b" strokeWidth="1.5" />
        <ellipse cx="81" cy="153" rx="7" ry="4" fill="#ffe680" />

        <circle cx="100" cy="86" r="27" fill="#ffd9a8" />
        <circle cx="84" cy="94" r="5" fill="#ff9aa2" opacity=".7" />
        <circle cx="116" cy="94" r="5" fill="#ff9aa2" opacity=".7" />

        <g className="tt-eyes">
          <path d="M86 84 q4 -5 8 0" stroke="#3a2a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M106 84 q4 -5 8 0" stroke="#3a2a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
        <path d="M94 98 q6 5 12 0" stroke="#a0522d" strokeWidth="2" fill="none" />

        <g className="tt-beard">
          <path d="M90 104 Q100 150 110 104 Q100 112 90 104Z" fill="#222" />
          <path d="M92 100 q-10 4 -16 -2 M108 100 q10 4 16 -2" stroke="#222" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        <path d="M76 70 Q100 40 124 70 Z" fill="#1d1d1d" />
        <rect x="74" y="66" width="52" height="8" rx="3" fill="#f6c945" />
        <circle cx="100" cy="56" r="5" fill="#e63946" stroke="#f6c945" strokeWidth="2" />
        <g className="tt-wingL"><ellipse cx="62" cy="60" rx="16" ry="5" fill="#1d1d1d" /></g>
        <g className="tt-wingR"><ellipse cx="138" cy="60" rx="16" ry="5" fill="#1d1d1d" /></g>

        <g className="tt-arm">
          <path d="M128 128 Q148 140 156 156" stroke="#d62828" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M150 150 Q168 168 178 190" stroke="#c99a2e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="164" cy="168" r="3.5" fill="#2ec4b6" />
          <path d="M170 188 q4 -10 12 -4 q10 -2 8 8 q6 8 -4 12 q-6 8 -14 0 q-8 -6 -2 -16z" fill="#2ec4b6" stroke="#f6c945" strokeWidth="2.5" />
          <circle cx="181" cy="196" r="3" fill="#f6c945" />
          <circle cx="156" cy="156" r="7" fill="#ffd9a8" />
        </g>
      </g>

      <g className="tt-spark">
        <path d="M182 200 l3 -10 l3 10 l10 3 l-10 3 l-3 10 l-3 -10 l-10 -3z" fill="#fff3a0" />
      </g>
      <circle className="tt-coin"    cx="182" cy="205" r="4" fill="#ffd34d" stroke="#b8860b" />
      <circle className="tt-coin c2" cx="182" cy="205" r="3" fill="#ffd34d" stroke="#b8860b" />
      <circle className="tt-coin c3" cx="182" cy="205" r="3.5" fill="#ffd34d" stroke="#b8860b" />
    </svg>
  );
}
