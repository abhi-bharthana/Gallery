import { motion } from 'framer-motion';
import { X, Download, Share2 } from 'lucide-react';

interface ImageViewerProps {
  image: { id: number; url: string };
  onClose: () => void;
}

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
  return (
    <>
      {/* 1. SOLID BACKGROUND - Jo piche ka sab kuch block karega */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-3xl"
        onClick={onClose}
      />

      {/* 2. TOP ACTION BAR */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ delay: 0.1, ease: "easeOut" }}
        className="fixed top-6 right-6 flex items-center gap-4 z-[1001]"
      >
        <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md transition-all group shadow-lg">
          <Share2 size={18} className="group-hover:scale-110 transition-transform" />
        </button>
        <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-purple-500/30 hover:border-purple-500/50 hover:text-purple-300 text-white backdrop-blur-md transition-all group shadow-lg">
          <Download size={18} className="group-hover:scale-110 transition-transform" />
        </button>
        <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
        <button 
          onClick={onClose}
          className="p-3 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 hover:border-red-500/50 text-red-400 backdrop-blur-md transition-all group shadow-lg"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </motion.div>

      {/* 3. THE IMAGE WRAPPER (With Drag Gestures) */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-10 pointer-events-none">
        <motion.img 
          // SAME LAYOUT ID = Seamless Morph Animation
          layoutId={`image-${image.id}`}
          src={image.url} 
          alt="Full screen preview" 
          
          // DRAG GESTURES: Image ko neeche swipe karke band kar sakte hain
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.8}
          onDragEnd={(e, { offset, velocity }) => {
            // Agar user ne jor se swipe kiya, ya 100px se zyada drag kiya toh close kardo
            if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
              onClose();
            }
          }}
          
          className="pointer-events-auto max-w-full max-h-full object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.05)] rounded-lg cursor-grab active:cursor-grabbing"
        />
      </div>
    </>
  );
}