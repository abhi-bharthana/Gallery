// src/components/ImageViewer/Navigation.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Navigation({ onNext, onPrev, hasNext, hasPrev }: any) {
  return (
    <AnimatePresence>
      {hasPrev && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="fixed left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl z-[1001] hover:scale-110 pointer-events-auto">
          <ChevronLeft size={24} />
        </motion.button>
      )}
      {hasNext && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="fixed right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl z-[1001] hover:scale-110 pointer-events-auto">
          <ChevronRight size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}