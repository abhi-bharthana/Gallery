// src/components/ImageViewer/index.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';
import InfoPanel from './InfoPanel';
import Navigation from './Navigation';
import ImageCanvas from './ImageCanvas';

export default function ImageViewer({ 
  image, isFavorite, isTrashed, albums, 
  onClose, onToggleFavorite, onDelete, onRestore, onAddToAlbum,
  onNext, onPrev, hasNext, hasPrev 
}: any) {
  const [showInfo, setShowInfo] = useState(false);
  const [scale, setScale] = useState(1);
  
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isCover, setIsCover] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); // 🔥 AUTOPLAY STATE
  
  // 🔥 FIX: NodeJS.Timeout ki jagah ReturnType<typeof setTimeout> use kiya
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isZoomed = scale > 1;

  // Auto-hide UI logic (3 seconds idle)
  useEffect(() => {
    const handleMouseMove = () => {
      setIsUiVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsUiVisible(false), 3000); 
    };

    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove(); 
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 🔥 AUTOPLAY EFFECT 🔥
  useEffect(() => {
    // 🔥 FIX: NodeJS.Timeout ki jagah ReturnType<typeof setInterval> use kiya
    let interval: ReturnType<typeof setInterval>;
    if (isAutoPlaying) {
      setIsUiVisible(false); // Play hote hi UI hide kar do
      interval = setInterval(() => {
        if (hasNext) onNext?.();
        else setIsAutoPlaying(false); // Last photo pe ruk jao
      }, 3000); // 3 sec timer
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, hasNext, onNext]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (scale === 1) { 
        if (e.key === 'ArrowRight' && hasNext) onNext?.();
        if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
        if (e.key === ' ') setIsAutoPlaying(prev => !prev); // Spacebar se Play/Pause
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onNext, onPrev, onClose, scale]);

  useEffect(() => {
    setScale(1);
    setShowInfo(false);
    setIsCover(false);
  }, [image.id]);

  const handleBackgroundTap = () => {
    if (showInfo) setShowInfo(false);
    else if (isAutoPlaying) setIsAutoPlaying(false);
    else onClose();
  };

  const handleImageTap = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (showInfo) setShowInfo(false);
    
    setIsUiVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsUiVisible(false), 3000);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-3xl"
        onClick={handleBackgroundTap}
      />

      <AnimatePresence>
        {isUiVisible && !isZoomed && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <TopBar 
              image={image} isFavorite={isFavorite} isTrashed={isTrashed} albums={albums}
              showInfo={showInfo} setShowInfo={setShowInfo}
              isCover={isCover} setIsCover={setIsCover}
              isAutoPlaying={isAutoPlaying} setIsAutoPlaying={setIsAutoPlaying}
              onClose={onClose} onToggleFavorite={onToggleFavorite} onDelete={onDelete} 
              onRestore={onRestore} onAddToAlbum={onAddToAlbum}
            />
            <Navigation onNext={onNext} onPrev={onPrev} hasNext={hasNext} hasPrev={hasPrev} />
          </motion.div>
        )}
      </AnimatePresence>

      <InfoPanel image={image} showInfo={showInfo && !isZoomed && isUiVisible} />

      <ImageCanvas 
        image={image} 
        scale={scale} setScale={setScale} 
        isCover={isCover}
        onClose={onClose} 
        handleBackgroundTap={handleBackgroundTap} 
        handleImageTap={handleImageTap} 
      />
    </>
  );
}