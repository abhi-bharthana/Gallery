// src/components/SplashScreen.tsx
import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div 
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }} 
      className="fixed inset-0 z-[99999] bg-[#000] flex items-center justify-center pointer-events-none"
    >
      {/* 
        🔥 INLINE SCOPED STYLES 🔥
        Isse global CSS gandi nahi hogi aur custom cubic-bezier animations perfect chalenge
      */}
      <style>{`
        .splash-svg { width: min(86vw, 86vh * 1.02, 760px); height: auto; overflow: visible; }
        .splash-svg * { transform-box: fill-box; }
        
        .splash-ball  { transform-origin: 50% 100%; animation: splash-ball 1.5s infinite; }
        .splash-grey  { transform-origin: 50% 100%; animation: splash-grey 1.5s infinite; }
        .splash-white { transform-origin: 50% 100%; animation: splash-white 1.5s infinite; }
        .splash-glow  { transform-origin: 50% 50%;  animation: splash-glow 1.5s infinite; }

        @keyframes splash-ball {
          0%   { transform: translateY(-230px) scale(1,1); animation-timing-function: cubic-bezier(.5,0,.9,.6); }
          46%  { transform: translateY(72px) scale(1,1);   animation-timing-function: ease-out; }
          50%  { transform: translateY(80px) scale(1.2,.8); animation-timing-function: ease-in-out; }
          55%  { transform: translateY(68px) scale(.94,1.08); animation-timing-function: cubic-bezier(.1,.5,.4,1); }
          100% { transform: translateY(-230px) scale(1,1); }
        }
        @keyframes splash-grey {
          0%, 47% { transform: scale(1,1); animation-timing-function: ease-out; }
          51%     { transform: scale(1.05,.88); animation-timing-function: ease-in-out; }
          58%     { transform: scale(.98,1.05); }
          68%, 100% { transform: scale(1,1); }
        }
        @keyframes splash-white {
          0%, 51% { transform: translateY(0) scale(1,1); animation-timing-function: ease-out; }
          56%     { transform: translateY(3px) scale(1.025,.95); animation-timing-function: ease-in-out; }
          64%     { transform: translateY(-3px) scale(.99,1.02); }
          76%, 100% { transform: translateY(0) scale(1,1); }
        }
        @keyframes splash-glow {
          0%, 47% { opacity: .05; transform: scaleX(.85); }
          52%     { opacity: .22; transform: scaleX(1.1); }
          80%, 100% { opacity: .05; transform: scaleX(.85); }
        }
      `}</style>

      <svg className="splash-svg" viewBox="180 120 900 880" role="img" aria-label="Loading">
        <ellipse className="splash-glow" cx="640" cy="945" rx="380" ry="16" fill="#fff" />
        <g className="splash-grey">
          <polygon points="825,672 1012,898 700,898" fill="#88888a" stroke="#88888a" strokeWidth="30" strokeLinejoin="round" />
        </g>
        <g className="splash-white">
          <polygon points="565,562 245,898 822,898" fill="#fafafa" stroke="#fafafa" strokeWidth="30" strokeLinejoin="round" />
        </g>
        <circle className="splash-ball" cx="875" cy="488" r="100" fill="#fafafa" />
      </svg>
    </motion.div>
  );
}