import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Image as ImageIcon, CalendarDays, Trash2, Check, X, RotateCcw } from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { LocalImage } from '../hooks/useGalleryData';

function Thumbnail({ image, className }: { image: LocalImage; className: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    invoke('get_thumbnail', { id: image.id, originalPath: image.rawPath })
      .then((thumbPath) => { if (mounted && thumbPath) setSrc(convertFileSrc(thumbPath as string)); })
      // 🔥 FIX: err ke aage underscore lagaya taaki TS error na de
      .catch((_err) => { if (mounted) setSrc(image.url); });
    return () => { mounted = false; };
  }, [image.id, image.rawPath, image.url]);

  if (!src) return <div className={`animate-pulse bg-white/5 ${className}`}></div>;
  return <img src={src} alt={image.filename} loading="lazy" decoding="async" className={className} />;
}

interface GalleryProps {
  photos: LocalImage[];
  isLoading: boolean;
  gridSize: 'small' | 'medium' | 'large';
  onImageClick: (image: LocalImage) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  isTrashView?: boolean; 
  onRestore?: (id: string) => void; 
}

export default function Gallery({ photos, isLoading, gridSize, onImageClick, favorites, onToggleFavorite, onDelete, isTrashView, onRestore }: GalleryProps) {
  const [displayCount, setDisplayCount] = useState(50);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastTapRef = useRef<number>(0);
  const isDragSelecting = useRef<boolean>(false);

  useEffect(() => {
    const stopDrag = () => { isDragSelecting.current = false; };
    window.addEventListener('pointerup', stopDrag);
    return () => window.removeEventListener('pointerup', stopDrag);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAction = () => {
    if (isTrashView && onRestore) {
      selectedIds.forEach(id => onRestore(id));
    } else {
      selectedIds.forEach(id => onDelete(id));
    }
    setSelectedIds(new Set());
  };

  useEffect(() => setDisplayCount(50), [photos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setDisplayCount(prev => Math.min(prev + 50, photos.length)); },
      { threshold: 0.1, rootMargin: '200px' } 
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [photos.length]);

  const visiblePhotos = photos.slice(0, displayCount);
  const groupedImages = useMemo(() => {
    const groups: { [key: string]: LocalImage[] } = {};
    visiblePhotos.forEach(img => {
      const date = new Date(img.timestamp * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(img);
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
      </div>
    );
  }

  return (
    <main className="relative z-10 w-full max-w-7xl mx-auto pb-12 space-y-12 select-none">
      {groupedImages.map((group) => (
        <div key={group.date} className="w-full relative">
          <div className="sticky top-4 z-30 flex justify-start mb-6 pointer-events-none">
            <div className="bg-[#0a0a0c]/70 backdrop-blur-3xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
              <div className="bg-purple-500/10 p-1.5 rounded-full text-purple-400"><CalendarDays size={16} /></div>
              <h2 className="text-sm font-bold tracking-wide text-white/90">{group.date}</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 after:content-[''] after:flex-grow-[10] after:h-0">
            {group.images.map((item) => {
              const isFav = favorites.includes(item.id);
              const isSelected = selectedIds.has(item.id);
              const isSelectionMode = selectedIds.size > 0;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ layout: { type: "spring", stiffness: 200, damping: 26, mass: 0.8 }, default: { duration: 0.3 } }}
                  key={item.id}
                  className={`relative group flex-grow shrink-0 basis-auto min-w-[20%] max-w-full ${gridSize === 'small' ? 'h-32 sm:h-40' : gridSize === 'medium' ? 'h-48 sm:h-64' : 'h-72 sm:h-[400px]'}`}
                >
                  <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out pointer-events-none">
                    <Thumbnail image={item} className="w-full h-full object-cover rounded-[1.75rem] blur-[40px] saturate-200 brightness-110 opacity-70" />
                  </div>

                  <div 
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey || isSelectionMode) {
                        e.stopPropagation();
                        toggleSelect(item.id);
                      } else {
                        onImageClick(item);
                      }
                    }}
                    // 🔥 FIX: Unused 'e' parameter ko hata diya
                    onPointerDown={() => {
                      const now = Date.now();
                      if (now - lastTapRef.current < 300) { 
                        isDragSelecting.current = true;
                        setSelectedIds(prev => new Set(prev).add(item.id)); 
                      }
                      lastTapRef.current = now;
                    }}
                    onPointerEnter={() => {
                      if (isDragSelecting.current) setSelectedIds(prev => new Set(prev).add(item.id));
                    }}
                    className={`relative overflow-hidden cursor-pointer bg-[#121214] rounded-[1.75rem] border w-full h-full transition-all duration-300 z-10 
                      ${isSelected ? 'border-purple-500 scale-[0.95] shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'border-white/[0.04] hover:border-white/10'}`}
                  >
                    
                    <Thumbnail image={item} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
                    
                    {isSelected && (
                      <div className="absolute top-4 left-4 z-20 bg-purple-500 text-white rounded-full p-1.5 shadow-lg scale-100 animate-in zoom-in">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}

                    <div className={`absolute top-4 right-4 flex flex-col gap-2 transition-all duration-300 z-20 translate-y-[-10px] group-hover:translate-y-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isTrashView ? (
                        <button onClick={(e) => { e.stopPropagation(); onRestore?.(item.id); }} className="p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-green-500/30 hover:text-green-400 text-white shadow-xl transition-all" title="Restore Image">
                          <RotateCcw size={16} />
                        </button>
                      ) : (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }} className="p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/20 text-white shadow-xl transition-all">
                            <Star size={16} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-yellow-400" : "text-white"} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-red-500/30 hover:text-red-400 text-white shadow-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {displayCount < photos.length && (
        <div ref={observerTarget} className="w-full h-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-medium tracking-widest uppercase">Loading more</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#121214]/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] z-[100]"
          >
            <span className="text-sm font-bold text-white tracking-wide">{selectedIds.size} Selected</span>
            <div className="w-[1px] h-6 bg-white/20"></div>
            
            <button onClick={handleBulkAction} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${isTrashView ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}>
              {isTrashView ? <><RotateCcw size={16} /> Restore</> : <><Trash2 size={16} /> Delete</>}
            </button>
            
            <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors">
              <X size={16} /> Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}