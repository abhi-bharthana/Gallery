// src/components/ImageViewer/ImageCanvas.tsx
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageCanvas({ 
  image, scale, setScale, isCover, 
  onClose, handleBackgroundTap, handleImageTap 
}: any) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const sensitivity = e.ctrlKey ? 0.012 : 0.002;
      setScale((prev: number) => Math.min(Math.max(prev - e.deltaY * sensitivity, 1), 6));
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, [setScale]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none overflow-hidden touch-none" 
      onClick={handleBackgroundTap}
    >
      {/* 🔥 HATA DIYA mode="wait" TAANI OVERLAP SMOOTH HO 🔥 */}
      <AnimatePresence>
        <motion.img 
          key={image.id} 
          src={image.url} 
          alt={image.filename} 
          
          // 🔥 PURE MAKKHAN OPACITY CROSSFADE (No Heavy Blur) 🔥
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale }}
          exit={{ opacity: 0 }}
          
          transition={{ 
            opacity: { duration: 0.7, ease: "easeInOut" }, // 0.7 seconds ka silky smooth fade
            scale: { type: "spring", stiffness: 800, damping: 50, mass: 0.2 } 
          }}
          
          drag={scale > 1 ? true : "y"}
          dragConstraints={scale > 1 ? undefined : { top: 0, bottom: 0 }}
          dragElastic={0.8}
          // 🔥 FIX: TS Error bypass karne ke liye 'e' ko '_e' kar diya 🔥
          onDragEnd={(_e, { offset, velocity }) => {
            if (scale === 1 && (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500)) {
              onClose();
            }
          }}
          onClick={handleImageTap}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setScale((prev: number) => prev > 1 ? 1 : 2.5);
          }}
          // 🔥 absolute class lagana zaroori tha overlap ke liye 🔥
          className={`absolute pointer-events-auto w-full h-full drop-shadow-[0_0_50px_rgba(255,255,255,0.05)] cursor-grab active:cursor-grabbing transition-all duration-300 ${isCover ? 'object-cover' : 'object-contain'}`}
        />
      </AnimatePresence>
    </div>
  );
}