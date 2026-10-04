// src/components/VideoPlayer/AuvemIntro.tsx
import { useEffect, useState, useRef } from 'react';

interface AuvemIntroProps {
  onComplete: () => void;
}

export default function AuvemIntro({ onComplete }: AuvemIntroProps) {
  const [particles, setParticles] = useState<any[]>([]);
  const introStarted = useRef(false); 

  useEffect(() => {
    // Agar ek baar intro shuru ho chuka hai, toh block kardo
    if (introStarted.current) return;
    introStarted.current = true;

    // Generate random particles exactly like the original HTML
    const sp = Array.from({ length: 36 }).map(() => ({
      left: Math.random() * 100 + '%',
      top: 30 + Math.random() * 60 + '%',
      animationDuration: 3 + Math.random() * 4 + 's',
      animationDelay: Math.random() * 5 + 's'
    }));
    setParticles(sp);

    let isCancelled = false; // Cleanup flag

    // 🔥 AUDIO COMPLETELY REMOVED! SILENT INTRO.

    // Exact 6.3 second timing mapped from original JS logic
    const timer = setTimeout(() => {
      if (!isCancelled) onComplete();
    }, 6300); 

    // Cleanup
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <div className="absolute inset-0 z-[5000] flex items-center justify-center font-['Syncopate',sans-serif] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #07070a 0%, #000 70%)', animation: 'intro-out 0.7s ease-in 5.5s forwards' }}>
      
      <style>{`
        .intro-stage::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 45%, #000 100%); pointer-events: none; }
        .intro-glow { position: absolute; width: 90vmin; height: 90vmin; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, transparent 68%); opacity: 0; animation: intro-bloom 3.6s ease-out 2s forwards; }
        .intro-flare { position: absolute; left: 0; right: 0; top: 50%; height: 2px; background: linear-gradient(90deg, transparent, #fff 50%, transparent); box-shadow: 0 0 40px 8px rgba(255,255,255,0.7); transform: scaleX(0); opacity: 0; animation: intro-flare 1.1s cubic-bezier(0.1,0.7,0.2,1) 2s forwards; }
        .intro-logo { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4vmin; filter: drop-shadow(0 0 22px rgba(255,255,255,0.45)); }
        .intro-mark { width: min(22vmin, 150px); height: auto; overflow: visible; }
        .intro-mark path, .intro-mark circle { fill: rgba(255,255,255,0); stroke: #fff; stroke-width: 2.4; stroke-linejoin: round; stroke-dasharray: 320; stroke-dashoffset: 320; animation: intro-draw 1.9s cubic-bezier(0.5,0,0.2,1) 0.2s forwards, intro-fill 0.5s ease 2s forwards; }
        .intro-mark .intro-dot { stroke-dasharray: none; stroke-dashoffset: 0; }
        .intro-word { font-weight: 700; font-size: clamp(26px, 7.5vw, 84px); letter-spacing: 1em; padding-left: 1em; opacity: 0; filter: blur(14px); white-space: nowrap; background: linear-gradient(105deg, #5c5c5c 0%, #5c5c5c 30%, #fff 46%, #fff 100%); background-size: 320% 100%; background-position: 0 0; -webkit-background-clip: text; background-clip: text; color: transparent; animation: intro-word 3.4s cubic-bezier(0.16,0.8,0.3,1) 2s forwards, intro-lit 1.6s ease-in-out 2.1s forwards; }
        .intro-tag { font-size: clamp(8px, 1.6vw, 12px); letter-spacing: 0.7em; padding-left: 0.7em; color: #8a8a8a; opacity: 0; animation: intro-tag 1.2s ease 3.4s forwards; }
        .intro-sp { position: absolute; width: 2px; height: 2px; border-radius: 50%; background: #fff; opacity: 0; animation: intro-sp linear infinite; }
        
        @keyframes intro-draw { to { stroke-dashoffset: 0; } }
        @keyframes intro-fill { to { fill: rgba(255,255,255,1); } }
        @keyframes intro-flare { 0% { transform: scaleX(0); opacity: 1; } 55% { opacity: 1; } 100% { transform: scaleX(1.4); opacity: 0; } }
        @keyframes intro-bloom { 0% { opacity: 0; transform: scale(0.5); } 20% { opacity: 1; } 100% { opacity: 0.45; transform: scale(1.15); } }
        @keyframes intro-word { 0% { opacity: 0; filter: blur(14px); letter-spacing: 1em; } 25% { opacity: 1; } 100% { opacity: 1; filter: blur(0); letter-spacing: 0.34em; } }
        @keyframes intro-lit { to { background-position: 100% 0; } }
        @keyframes intro-tag { to { opacity: 1; } }
        @keyframes intro-out { to { opacity: 0; } }
        @keyframes intro-sp { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 0.6; } 100% { opacity: 0; transform: translateY(-60px); } }
      `}</style>

      <div className="intro-glow"></div>
      <div className="intro-flare"></div>
      
      <div className="intro-logo">
        <svg className="intro-mark" viewBox="0 0 100 100">
          <path d="M50 8 L90 90 H68 L50 52 L32 90 H10 Z"/>
          <circle className="intro-dot" cx="50" cy="76" r="3.5"/>
        </svg>
        <div className="intro-word">AUVEM</div>
        <div className="intro-tag">FROM HYPER REALM</div>
      </div>

      {particles.map((p, i) => (
        <i key={i} className="intro-sp" style={p}></i>
      ))}
    </div>
  );
}