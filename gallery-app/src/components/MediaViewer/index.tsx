// src/components/MediaViewer/index.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';
import InfoPanel from './InfoPanel';
import Navigation from './Navigation';
import ImageCanvas from './ImageCanvas';
import VideoPlayer from '../VideoPlayer'; // 🔥 Naya Import

// 🔥 Naam badal kar MediaViewer kar diya
export default function MediaViewer({ 
  image, isFavorite, isTrashed, albums, 
  onClose, onToggleFavorite, onDelete, onRestore, onAddToAlbum,
  onNext, onPrev, hasNext, hasPrev 
}: any) {
  const [showInfo, setShowInfo] = useState(false);
  const [scale, setScale] = useState(1);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isCover, setIsCover] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); 
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isZoomed = scale > 1;

  const isExternal = image?.id?.startsWith('external-view-');
  // 🔥 Video Check Logic
  const isVideo = image?.filename?.match(/\.(mp4|mkv|mov|webm)$/i) || image?.type === 'video';

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAutoPlaying && !isVideo) { // Video pe autoplay image slider wala nahi chalega
      setIsUiVisible(false); 
      interval = setInterval(() => {
        if (hasNext) onNext?.();
        else setIsAutoPlaying(false); 
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, hasNext, onNext, isVideo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (scale === 1) { 
        if (e.key === 'ArrowRight' && hasNext) onNext?.();
        if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
        if (e.key === ' ' && !isVideo) setIsAutoPlaying(prev => !prev); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onNext, onPrev, onClose, scale, isVideo]);

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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <TopBar 
              image={image} isFavorite={isFavorite} isTrashed={isTrashed} albums={albums}
              showInfo={showInfo} setShowInfo={setShowInfo}
              isCover={isCover} setIsCover={setIsCover}
              isAutoPlaying={isAutoPlaying} setIsAutoPlaying={setIsAutoPlaying}
              onClose={onClose} 
              isExternal={isExternal}
              onToggleFavorite={isExternal ? undefined : onToggleFavorite} 
              onDelete={isExternal ? undefined : onDelete} 
              onRestore={isExternal ? undefined : onRestore} 
              onAddToAlbum={isExternal ? undefined : onAddToAlbum}
            />
            <Navigation onNext={onNext} onPrev={onPrev} hasNext={hasNext} hasPrev={hasPrev} />
          </motion.div>
        )}
      </AnimatePresence>

      <InfoPanel image={image} showInfo={showInfo && !isZoomed && isUiVisible} />

      {/* 🔥 MAIN LOGIC: Yahan Video ya Image canvas decide hoga */}
      {isVideo ? (
        <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center">
          <div className="w-full h-full pointer-events-auto">
            <VideoPlayer src={image.url} isCover={isCover} onToggleCover={() => setIsCover(!isCover)} />
          </div>
        </div>
      ) : (
        <ImageCanvas 
          image={image} scale={scale} setScale={setScale} isCover={isCover}
          onClose={onClose} handleBackgroundTap={handleBackgroundTap} handleImageTap={handleImageTap} 
        />
      )}
    </>
  );
}