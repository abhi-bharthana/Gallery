// src/components/Gallery/Thumbnail.tsx
import { useState, useEffect, useMemo } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { LocalImage } from '../../hooks/useGalleryData';

interface ThumbnailProps {
  image: LocalImage;
  className: string;
  gridSize?: 'small' | 'medium' | 'large';
}

export default function Thumbnail({ image, className, gridSize = 'medium' }: ThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolution = useMemo(() => {
    if (gridSize === 'small') return 400;
    if (gridSize === 'medium') return 800;
    return 1200;
  }, [gridSize]);

  useEffect(() => {
    let mounted = true;
    setSrc(null);
    setIsLoaded(false);

    invoke('get_thumbnail', { id: image.id, originalPath: image.rawPath, size: resolution })
      .then((thumbPath) => { 
        if (mounted) {
          if (thumbPath) setSrc(convertFileSrc(thumbPath as string)); 
          else setSrc(image.url); 
        }
      })
      .catch((_err) => { 
        if (mounted) setSrc(image.url); 
      });

    return () => { mounted = false; };
  }, [image.id, image.rawPath, image.url, resolution]);

  const isBlurLayer = className.includes('blur-');

  return (
    <>
      {/* 1. SKELETON: Clean dark placeholder jo baaki UI block nahi karega */}
      {!isLoaded && !isBlurLayer && (
        <div className={`absolute inset-0 bg-[#121214] animate-pulse pointer-events-none z-0 ${className.includes('rounded') ? 'rounded-[1.75rem]' : ''}`} />
      )}

      {/* 2. SMART WRAPPER: Fade aur Blur strictly is div se control hoga */}
      {src && (
        <div 
          className={`w-full h-full pointer-events-none transition-all duration-[1.2s] ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${!isBlurLayer ? (isLoaded ? 'blur-0' : 'blur-xl') : ''}`}
        >
          {/* 3. MAIN IMAGE: Is par sirf Tailwind ka hover scale chalega, koi interference nahi! */}
          <img 
            src={src} 
            alt={image.filename} 
            loading="lazy" 
            decoding="async" 
            onLoad={() => setIsLoaded(true)}
            className={className} 
          />
        </div>
      )}
    </>
  );
}