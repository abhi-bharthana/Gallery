// src/components/VideoPlayer/TopTitle.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface TopTitleProps {
  title?: string;
  showControls: boolean;
}

export default function TopTitle({ title, showControls }: TopTitleProps) {
  return (
    <AnimatePresence>
      {showControls && title && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="absolute top-0 left-0 right-0 z-20 px-6 pt-5 pb-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }}
        >
          <p className="text-[15px] font-medium text-white/90 tracking-wide truncate" style={{ letterSpacing: '0.01em' }}>
            {title}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}