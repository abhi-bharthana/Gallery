// src/components/MediaViewer/useMediaControls.ts
import { useState, useEffect, useRef } from 'react';

export function useMediaControls({ onClose, onNext, onPrev, hasNext, hasPrev, isVideo, imageId }: any) {
  const [showInfo, setShowInfo] = useState(false);
  const [scale, setScale] = useState(1);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isCover, setIsCover] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setScale(1);
    setShowInfo(false);
    setIsCover(false);
  }, [imageId]);

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
    if (isAutoPlaying && !isVideo) { 
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

  return {
    showInfo, setShowInfo,
    scale, setScale,
    isUiVisible, setIsUiVisible,
    isCover, setIsCover,
    isAutoPlaying, setIsAutoPlaying,
    handleBackgroundTap, handleImageTap,
    isZoomed: scale > 1
  };
}