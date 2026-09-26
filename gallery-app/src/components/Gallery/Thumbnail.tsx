// src/components/Gallery/Thumbnail.tsx
import { useState, useEffect } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { LocalImage } from '../../hooks/useGalleryData';

interface ThumbnailProps {
  image: LocalImage;
  gridSize: 'small' | 'medium' | 'large';
  className?: string;
}

// 🛡️ Global cache map taaki scroll karne par dobara fetch na karna pade
const thumbnailCache = new Map<string, string>();

export default function Thumbnail({ image, gridSize, className }: ThumbnailProps) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string>(() => {
    return thumbnailCache.get(image.id) || '';
  });
  const [isLoading, setIsLoading] = useState<boolean>(!thumbnailCache.has(image.id));

  useEffect(() => {
    if (thumbnailCache.has(image.id)) {
      setThumbnailSrc(thumbnailCache.get(image.id)!);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const size = gridSize === 'small' ? 200 : gridSize === 'medium' ? 400 : 800;

    invoke('get_thumbnail', { 
      id: image.id, 
      originalPath: image.rawPath, 
      size 
    })
      .then((path) => {
        if (isMounted && typeof path === 'string') {
          const converted = convertFileSrc(path);
          thumbnailCache.set(image.id, converted);
          setThumbnailSrc(converted);
        }
      })
      .catch((err) => {
        console.error("Thumbnail load failed for:", image.filename, err);
        // Fallback to original path agar thumbnail fail ho jaye toh app crash na ho
        if (isMounted) {
          const fallback = convertFileSrc(image.rawPath);
          setThumbnailSrc(fallback);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [image.id, image.rawPath, gridSize]);

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      )}
      {thumbnailSrc ? (
        <img 
          src={thumbnailSrc} 
          alt={image.filename}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      ) : (
        <div className="w-full h-full bg-zinc-800/50" />
      )}
    </div>
  );
}