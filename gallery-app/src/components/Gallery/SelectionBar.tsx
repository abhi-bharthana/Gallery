// src/components/Gallery/SelectionBar.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, RotateCcw } from 'lucide-react';

interface SelectionBarProps {
  selectedCount: number;
  isTrashView?: boolean;
  onBulkAction: () => void;
  onCancel: () => void;
}

export default function SelectionBar({ selectedCount, isTrashView, onBulkAction, onCancel }: SelectionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          // 🔥 PREMIUM SPRING SLIDE ANIMATION 🔥
          initial={{ y: 80, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: 80, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30, 
            mass: 0.8 
          }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#1a1a1c]/75 backdrop-blur-2xl border border-white/[0.08] px-6 py-3.5 rounded-full flex items-center gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[100]"
        >
          {/* Text fade in smoothly */}
          <motion.span 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-sm font-semibold text-white tracking-wide"
          >
            {selectedCount} Selected
          </motion.span>
          
          <div className="w-[1px] h-5 bg-white/10"></div>
          
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex items-center gap-4"
          >
            <button 
              onClick={onBulkAction} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isTrashView 
                  ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10' 
                  : 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
              }`}
            >
              {isTrashView ? <RotateCcw size={15} /> : <Trash2 size={15} />}
              {isTrashView ? 'Restore' : 'Delete'}
            </button>
            
            <button 
              onClick={onCancel} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={15} />
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}