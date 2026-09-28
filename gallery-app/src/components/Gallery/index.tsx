// src/components/Gallery/index.tsx
import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, CalendarDays } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LocalImage } from '../../hooks/useGalleryData';
import GalleryItem from './GalleryItem';
import SelectionBar from './SelectionBar';

export interface GalleryProps {
  photos: LocalImage[];
  videoHistory?: Record<string, any>; 
  isLoading: boolean;
  gridSize: 'small' | 'medium' | 'large';
  onImageClick: (image: LocalImage) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  isTrashView?: boolean; 
  onRestore?: (id: string) => void; 
  onLockToVault?: (ids: string[]) => void;
}

const CHUNK_SIZE = 30; 

export default function Gallery({ photos, videoHistory = {}, isLoading, gridSize, onImageClick, favorites, onToggleFavorite, onDelete, isTrashView, onRestore, onLockToVault }: GalleryProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastTapRef = useRef<number>(0);
  const isDragSelecting = useRef<boolean>(false);
  const [scrollContainer, setScrollContainer] = useState<Element | null>(null);

  useEffect(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) setScrollContainer(el);
  }, []);

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

  const continueWatching = useMemo(() => {
    if (isTrashView || !photos.length || Object.keys(videoHistory).length === 0) return [];
    
    return Object.entries(videoHistory)
      .sort((a, b) => b[1].last_watched_at - a[1].last_watched_at) 
      .map(([path, data]) => {
         const photo = photos.find(p => p.rawPath.replace(/\\/g, '/') === path);
         if (photo && data.duration > 0) {
            const pct = data.progress / data.duration;
            if (pct > 0.01 && pct < 0.98) return { photo, data };
         }
         return null;
      })
      .filter(Boolean)
      .slice(0, 8); 
  }, [videoHistory, photos, isTrashView]);

  const flattenedItems = useMemo(() => {
    const items: any[] = [];
    
    if (continueWatching.length > 0) {
      items.push({ type: 'continue_watching', data: continueWatching });
    }

    const groups: { [key: string]: LocalImage[] } = {};
    photos.forEach(img => {
      const date = new Date(img.timestamp * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(img);
    });

    Object.entries(groups).forEach(([date, imgs]) => {
      items.push({ type: 'header', title: date });
      for (let i = 0; i < imgs.length; i += CHUNK_SIZE) {
        items.push({ type: 'block', items: imgs.slice(i, i + CHUNK_SIZE) });
      }
    });

    return items;
  }, [photos, continueWatching]);

  const virtualizer = useVirtualizer({
    count: flattenedItems.length,
    getScrollElement: () => scrollContainer,
    estimateSize: (index) => {
      const item = flattenedItems[index];
      if (item.type === 'continue_watching') return 280; // 🔥 Height reduce ki hai kyunki cards chhote ho gaye hain
      if (item.type === 'header') return 80; 
      return 600; 
    },
    overscan: 2, 
  });

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center h-full text-purple-400">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-sm tracking-wide opacity-80">Organizing timeline...</p>
      </motion.div>
    );
  }

  if (photos.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center h-full text-gray-500">
        <ImageIcon size={48} className="mb-4 opacity-40" />
        <p className="font-medium text-lg text-gray-400 tracking-wide">No images found</p>
      </motion.div>
    );
  }

  return (
    <main className="relative z-10 w-full max-w-7xl mx-auto pb-12 select-none">
      
      <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flattenedItems[virtualRow.index];

          return (
            <div
              key={virtualRow.index}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: item.type === 'block' ? '1.5rem' : '0'
              }}
            >
              
              {item.type === 'continue_watching' && (
                <div className="mb-8 relative group/cw">
                  <h2 className="text-xl font-extrabold text-white mb-5 px-2 flex items-center gap-3 drop-shadow-md">
                    <span className="w-1.5 h-6 bg-gradient-to-b from-red-500 to-red-700 rounded-full inline-block shadow-[0_0_15px_rgba(239,68,68,0.6)]"></span>
                    Continue Watching
                  </h2>

                  <div className="absolute right-0 top-12 bottom-0 w-24 bg-gradient-to-l from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent z-20 pointer-events-none opacity-0 md:opacity-100"></div>

                  <div className="flex gap-5 overflow-x-auto pb-8 pt-2 px-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {item.data.map(({ photo, data }: any) => {
                      const progressPct = data.duration > 0 ? (data.progress / data.duration) * 100 : 0;
                      
                      // 🔥 SIZE REDUCED: 224px se 192px kar diya taaki medium grid chhota lage
                      const ratio = (photo.width && photo.height) ? (photo.width / photo.height) : 16/9;
                      const cardWidth = Math.max(180, 192 * ratio);

                      return (
                        <div 
                          key={`cw-${photo.id}`} 
                          className="snap-start shrink-0 relative transition-transform duration-300 ease-out hover:-translate-y-1.5"
                          style={{ width: `${cardWidth}px`, height: '192px' }}
                        >
                          <GalleryItem
                            item={photo} gridSize="medium" progressPercent={progressPct}
                            isFav={favorites.includes(photo.id)} isSelected={selectedIds.has(photo.id)}
                            isSelectionMode={selectedIds.size > 0} isTrashView={isTrashView}
                            onImageClick={onImageClick} toggleSelect={toggleSelect} onToggleFavorite={onToggleFavorite}
                            onDelete={onDelete} onRestore={onRestore}
                            onPointerDown={() => {}} onPointerEnter={() => {}}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {item.type === 'header' && (
                <div className="flex justify-start mb-6 pointer-events-none">
                  <div className="bg-[#0a0a0c]/70 backdrop-blur-3xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
                    <div className="bg-purple-500/10 p-1.5 rounded-full text-purple-400"><CalendarDays size={16} /></div>
                    <h2 className="text-sm font-bold tracking-wide text-white/90">{item.title}</h2>
                  </div>
                </div>
              )}

              {item.type === 'block' && (
                <div className="flex flex-wrap gap-3 sm:gap-4 after:content-[''] after:flex-grow-[10] after:h-0">
                  {item.items.map((photo: LocalImage) => {
                    const safeKey = photo.id;
                    const histData = videoHistory[photo.rawPath.replace(/\\/g, '/')];
                    const progressPct = histData && histData.duration > 0 ? (histData.progress / histData.duration) * 100 : undefined;

                    return (
                      <GalleryItem
                        key={safeKey}
                        item={photo}
                        gridSize={gridSize}
                        progressPercent={progressPct}
                        isFav={favorites.includes(photo.id)}
                        isSelected={selectedIds.has(photo.id)}
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
                            setSelectedIds(prev => new Set(prev).add(photo.id));
                          }
                          lastTapRef.current = now;
                        }}
                        onPointerEnter={() => {
                          if (isDragSelecting.current) setSelectedIds(prev => new Set(prev).add(photo.id));
                        }}
                      />
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

      <SelectionBar 
        selectedCount={selectedIds.size}
        isTrashView={isTrashView}
        onBulkAction={handleBulkAction}
        onCancel={() => setSelectedIds(new Set())}
        onLockToVault={onLockToVault ? () => {
          onLockToVault(Array.from(selectedIds));
          setSelectedIds(new Set());
        } : undefined}
      />
    </main>
  );
}