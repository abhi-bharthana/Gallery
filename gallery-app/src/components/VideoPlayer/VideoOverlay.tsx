// src/components/VideoPlayer/VideoOverlay.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Play, Pause, Rewind, FastForward, Star } from 'lucide-react';

interface VideoOverlayProps {
  isLoading: boolean;
  isPlaying: boolean;
  togglePlay: () => void;
  ripple: { side: 'left' | 'right'; key: number } | null;
  skipBadge: { text: string; key: number } | null;
  favoriteStar: { x: number; y: number; key: number } | null;
  actionIcon: 'play' | 'pause' | null; // 🔥 NAYA PROP
  handleVideoAreaClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function VideoOverlay({
  isLoading, ripple, skipBadge, favoriteStar, actionIcon, handleVideoAreaClick
}: VideoOverlayProps) {
  return (
    <>
      <div className="absolute inset-0 z-10" onClick={handleVideoAreaClick} />

      {/* Elegant Loader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <Loader2 size={44} className="text-white/60 animate-spin" strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔥 THE PREMIUM CENTER ACTION POPUP (Apple/Netflix Style) */}
      <AnimatePresence>
        {actionIcon && (
          <motion.div
            key={actionIcon + Date.now()}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 2, filter: "blur(12px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/25 backdrop-blur-2xl border border-white/10 text-white p-6 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              {actionIcon === 'play' 
                ? <Play size={44} fill="currentColor" className="ml-1" /> 
                : <Pause size={44} fill="currentColor" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smooth Glowing Star */}
      <AnimatePresence>
        {favoriteStar && (
          <motion.div
            key={favoriteStar.key}
            initial={{ opacity: 0, scale: 0.3, rotate: -45 }} 
            animate={{ opacity: 1, scale: 1.2, rotate: 0 }} 
            exit={{ opacity: 0, scale: 2.2, filter: "blur(15px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed z-50 pointer-events-none text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,0.8)]"
            style={{ left: favoriteStar.x - 40, top: favoriteStar.y - 40 }}
          >
            <Star size={80} fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimalist Skip Ripples */}
      <AnimatePresence>
        {ripple && (
          <motion.div
            key={ripple.key}
            initial={{ opacity: 0.3, scale: 0.6 }} animate={{ opacity: 0, scale: 1.8 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`absolute top-0 bottom-0 z-10 w-1/3 flex items-center justify-center pointer-events-none ${ripple.side === 'left' ? 'left-10' : 'right-10'}`}
          >
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              {ripple.side === 'left' ? <Rewind size={32} className="text-white/90" fill="currentColor" /> : <FastForward size={32} className="text-white/90" fill="currentColor" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cumulative Skip Badge */}
      <AnimatePresence>
        {skipBadge && (
          <motion.div
            key={skipBadge.key}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute z-30 top-12 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-black/40 backdrop-blur-2xl border border-white/5 text-[#EAD9AD] font-semibold text-sm tracking-widest shadow-2xl pointer-events-none"
          >
            {skipBadge.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}