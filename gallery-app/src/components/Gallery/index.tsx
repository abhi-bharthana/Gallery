// src/components/Gallery/index.tsx
import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, CalendarDays } from 'lucide-react';
import { LocalImage } from '../../hooks/useGalleryData';
import GalleryItem from './GalleryItem';
import SelectionBar from './SelectionBar';

export interface GalleryProps {
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
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="flex-1 flex flex-col items-center justify-center h-full text-purple-400"
      >
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-sm tracking-wide opacity-80">Organizing timeline...</p>
      </motion.div>
    );
  }

  if (photos.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="flex-1 flex flex-col items-center justify-center h-full text-gray-500"
      >
        <ImageIcon size={48} className="mb-4 opacity-40" />
        <p className="font-medium text-lg text-gray-400 tracking-wide">No images found</p>
      </motion.div>
    );
  }

  return (
    <main className="relative z-10 w-full max-w-7xl mx-auto pb-12 space-y-12 select-none">
      {groupedImages.map((group, groupIndex) => (
        <motion.div 
          key={group.date || `group-${groupIndex}`} 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: groupIndex * 0.08 }}
          className="w-full relative"
        >
          <div className="sticky top-4 z-30 flex justify-start mb-6 pointer-events-none">
            <div className="bg-[#0a0a0c]/70 backdrop-blur-3xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
              <div className="bg-purple-500/10 p-1.5 rounded-full text-purple-400"><CalendarDays size={16} /></div>
              <h2 className="text-sm font-bold tracking-wide text-white/90">{group.date}</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 after:content-[''] after:flex-grow-[10] after:h-0">
            {group.images.map((item, itemIndex) => {
              // 🔥 Bulletproof Unique Key Generator
              const safeKey = item.id && item.id.trim() !== '' ? item.id : `fallback-${group.date}-${itemIndex}`;

              return (
                <GalleryItem
                  key={safeKey}
                  item={item}
                  gridSize={gridSize}
                  isFav={favorites.includes(item.id)}
                  isSelected={selectedIds.has(item.id)}
                  isSelectionMode={selectedIds.size > 0}
                  isTrashView={isTrashView}
                  onImageClick={onImageClick}
                  toggleSelect={toggleSelect}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDelete}
                  onRestore={onRestore}
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
                />
              );
            })}
          </div>
        </motion.div>
      ))}

      {displayCount < photos.length && (
        <div ref={observerTarget} className="w-full h-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-medium tracking-widest uppercase opacity-70">Loading more</span>
          </div>
        </div>
      )}

      <SelectionBar 
        selectedCount={selectedIds.size}
        isTrashView={isTrashView}
        onBulkAction={handleBulkAction}
        onCancel={() => setSelectedIds(new Set())}
      />
    </main>
  );
}