// src/components/ImageViewer/InfoPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';

export default function InfoPanel({ image, showInfo }: { image: any, showInfo: boolean }) {
  return (
    <AnimatePresence>
      {showInfo && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
          className="fixed bottom-8 left-8 bg-[#121214]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl z-[1001] max-w-sm pointer-events-auto"
          onClick={(e) => e.stopPropagation()} 
        >
          <h3 className="font-bold text-white text-lg mb-1 truncate" title={image.filename}>{image.filename}</h3>
          <p className="text-xs text-gray-400 mb-3 break-all">{image.rawPath || image.url}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300 font-mono">
            {new Date(image.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}