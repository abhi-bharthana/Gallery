import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Image as ImageIcon, CalendarDays } from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { LocalImage } from '../hooks/useGalleryData';

// 🔥 NAYA THUMBNAIL COMPONENT 🔥
function Thumbnail({ image, className }: { image: LocalImage; className: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Rust se 400x400 ka thumbnail maango
    invoke('get_thumbnail', { id: image.id, originalPath: image.rawPath })
      .then((thumbPath) => {
        if (mounted && thumbPath) {
          setSrc(convertFileSrc(thumbPath as string));
        }
      })
      .catch((err) => {
        console.error("Thumbnail failed, falling back to original", err);
        // Agar galti se fail hua, toh original file dikha do
        if (mounted) setSrc(image.url); 
      });

    return () => { mounted = false; };
  }, [image.id, image.rawPath, image.url]);

  if (!src) {
    // Jab tak Rust image process kar raha hai, tab tak premium dark skeleton loading
    return <div className={`animate-pulse bg-white/5 ${className}`}></div>;
  }

  return <img src={src} alt={image.filename} loading="lazy" decoding="async" className={className} />;
}

interface GalleryProps {
  photos: LocalImage[];
  isLoading: boolean;
  gridSize: 'small' | 'medium' | 'large';
  onImageClick: (image: LocalImage) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export default function Gallery({ photos, isLoading, gridSize, onImageClick, favorites, onToggleFavorite }: GalleryProps) {
  // 🔥 PROGRESSIVE RENDERING STATE 🔥
  const [displayCount, setDisplayCount] = useState(50);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Jab tab change ho ya search ho, display count reset kar do
  useEffect(() => {
    setDisplayCount(50);
  }, [photos]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Bottom pe pahunchte hi agli 50 photos add kar do
          setDisplayCount((prev) => Math.min(prev + 50, photos.length));
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // 200px pehle hi load shuru kar dega
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [photos.length]);

  // Sirf utni photos process karo jitni display karni hain
  const visiblePhotos = photos.slice(0, displayCount);

  // Group images by date using visiblePhotos
  const groupedImages = useMemo(() => {
    const groups: { [key: string]: LocalImage[] } = {};
    visiblePhotos.forEach(img => {
      const date = new Date(img.timestamp * 1000);
      const dateString = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(img);
    });
    return Object.entries(groups).map(([date, imgs]) => ({ date, images: imgs }));
  }, [visiblePhotos]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-purple-400">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-sm">Organizing timeline...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-gray-500">
        <ImageIcon size={48} className="mb-4 opacity-50" />
        <p className="font-medium text-lg text-gray-300">No images found</p>
        <p className="text-sm mt-1">Try syncing a folder or modifying your search.</p>
      </div>
    );
  }

  return (
    <main className="relative z-10 w-full max-w-7xl mx-auto pb-12 space-y-12">
      {groupedImages.map((group) => (
        <div key={group.date} className="w-full relative">
          <div className="sticky top-4 z-30 flex justify-start mb-6 pointer-events-none">
            <div className="bg-[#0a0a0c]/70 backdrop-blur-3xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] pointer-events-auto transition-all duration-300 hover:bg-[#121214]/90 hover:border-purple-500/40 group">
              <div className="bg-purple-500/10 p-1.5 rounded-full text-purple-400 group-hover:text-purple-300 transition-colors">
                <CalendarDays size={16} />
              </div>
              <h2 className="text-sm font-bold tracking-wide text-white/90 group-hover:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {group.date}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 after:content-[''] after:flex-grow-[10] after:h-0">
            {group.images.map((item) => {
              const isFav = favorites.includes(item.id);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ layout: { type: "spring", stiffness: 200, damping: 26, mass: 0.8 }, default: { duration: 0.3 } }}
                  key={item.id}
                  className={`relative group flex-grow shrink-0 basis-auto min-w-[20%] max-w-full ${gridSize === 'small' ? 'h-32 sm:h-40' : gridSize === 'medium' ? 'h-48 sm:h-64' : 'h-72 sm:h-[400px]'}`}
                >
                  <div onClick={() => onImageClick(item)} style={{ contentVisibility: 'auto' }} className="relative overflow-hidden cursor-pointer bg-[#121214] rounded-[1.75rem] border border-white/[0.04] w-full h-full hover:border-white/10 transition-colors duration-300 z-10">
                    
                    {/* 🔥 ORIGINAL IMG TAG REPLACED WITH CUSTOM THUMBNAIL COMPONENT 🔥 */}
                    <Thumbnail 
                      image={item}
                      className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 translate-y-[-10px] group-hover:translate-y-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                        className="p-2.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:border-white/30 text-white shadow-xl transition-all"
                      >
                        <Star size={16} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-yellow-400" : "text-white"} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 🔥 INFINITE SCROLL TRIGGER POINT 🔥 */}
      {displayCount < photos.length && (
        <div ref={observerTarget} className="w-full h-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-medium tracking-widest uppercase">Loading more</span>
          </div>
        </div>
      )}
    </main>
  );
}