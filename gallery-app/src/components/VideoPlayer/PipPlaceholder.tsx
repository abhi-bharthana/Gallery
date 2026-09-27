// src/components/VideoPlayer/PipPlaceholder.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { PictureInPicture2 } from 'lucide-react';

export default function PipPlaceholder({ isPiPActive }: { isPiPActive: boolean }) {
  return (
    <AnimatePresence>
      {isPiPActive && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 z-[15] flex flex-col items-center justify-center bg-[#0a0a0c]/80 backdrop-blur-3xl pointer-events-none"
        >
          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center">
            <PictureInPicture2 size={64} className="text-[#D4AF6A] mb-5 drop-shadow-[0_0_20px_rgba(212,175,106,0.6)]" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Playing in Miniplayer</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-[280px] leading-relaxed">
              You can browse your gallery. Drag the edges of the mini window to resize it.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}