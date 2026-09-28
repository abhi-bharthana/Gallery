// src/components/Gallery/Thumbnail.tsx
import { useState, useEffect, useRef } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { LocalImage } from '../../hooks/useGalleryData';

interface ThumbnailProps {
  image: LocalImage;
  gridSize: 'small' | 'medium' | 'large';
  className?: string;
}

const MAX_CACHE_SIZE = 500;
const thumbnailCache = new Map<string, string>();

export default function Thumbnail({ image, gridSize, className }: ThumbnailProps) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string>(() => thumbnailCache.get(image.id) || '');
  const [isFetching, setIsFetching] = useState<boolean>(!thumbnailCache.has(image.id));
  const [isImageReady, setIsImageReady] = useState<boolean>(false);

  useEffect(() => {
    if (thumbnailCache.has(image.id)) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); 
        }
      },
      { rootMargin: '300px', threshold: 0.01 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [image.id]);

  useEffect(() => {
    if (!isVisible) return; 
    if (thumbnailCache.has(image.id)) {
      setThumbnailSrc(thumbnailCache.get(image.id)!);
      setIsFetching(false);
      return;
    }
    
    let isMounted = true;
    let isCompleted = false; 

    // DEBOUNCE TIMER ADDED: 150ms wait karega request bhejane se pehle
    const delayTimer = setTimeout(() => {
      invoke('get_thumbnail', { id: image.id, originalPath: image.rawPath, size: 500 })
        .then((path) => {
          isCompleted = true; 
          if (isMounted && typeof path === 'string') {
            const converted = convertFileSrc(path);
            if (thumbnailCache.size >= MAX_CACHE_SIZE) {
              const firstKey = thumbnailCache.keys().next().value;
              if (firstKey) thumbnailCache.delete(firstKey);
            }
            thumbnailCache.set(image.id, converted);
            setThumbnailSrc(converted);
          }
        })
        .catch((err) => {
          isCompleted = true; 
          if (isMounted && err !== "Task cancelled by frontend") {
            const fallback = convertFileSrc(image.rawPath);
            setThumbnailSrc(fallback);
          }
        })
        .finally(() => {
          if (isMounted) setIsFetching(false);
        });
    }, 150);

    return () => {
      isMounted = false;
      // Component hide hote hi timer cancel (Tauri bridge hit hi nahi hoga)
      clearTimeout(delayTimer); 
      
      // Agar request nikal chuki thi, tabhi Rust kill switch dabayenge
      if (!isCompleted) invoke('cancel_thumbnail', { id: image.id }).catch(console.error);
    };
  }, [image.id, image.rawPath, isVisible]);

  return (
    <div ref={imgRef} className="relative w-full h-full rounded-[1.75rem]">
      
      {/* 1. AMBIENT GLOW LAYER (FREE & UNCLIPPED) */}
      {thumbnailSrc && (
        <img
          src={thumbnailSrc}
          alt="glow"
          // 🔥 HATA DIYA: loading="lazy" (Kyunki humara IntersectionObserver pehle hi lazy load kar raha hai)
          className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-700 ease-out pointer-events-none 
            blur-[35px] saturate-[3] scale-[1.25] -z-10
            ${isImageReady ? 'opacity-0 group-hover:opacity-75' : 'opacity-0'} 
          `}
        />
      )}

      {/* 2. MAIN IMAGE CONTAINER (LOCKED & CLIPPED) */}
      <div className="relative z-10 w-full h-full rounded-[1.75rem] overflow-hidden bg-[#121214]">
        
        {!isImageReady && (
          <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-0">
             <div className="w-5 h-5 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        )}

        {thumbnailSrc && (
          <img
            src={thumbnailSrc}
            alt={image.filename}
            // 🔥 HATA DIYA: loading="lazy" (Isse browser console me Intervention warning nahi aayegi)
            decoding="async"
            onLoad={() => setIsImageReady(true)} 
            className={`w-full h-full object-cover transition-all duration-700 ease-out 
              ${className || ''} 
              ${isImageReady ? 'blur-0 opacity-100' : 'blur-md opacity-0 scale-110'}
            `}
          />
        )}
      </div>
      
    </div>
  );
}