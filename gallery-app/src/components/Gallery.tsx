import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Image as ImageIcon, CalendarDays } from 'lucide-react';

interface LocalImage {
  id: number;
  url: string;
  timestamp: number;
}

interface GalleryProps {
  photos: LocalImage[];           // Data ab App.tsx se aayega
  isLoading: boolean;             // Loading state bhi App.tsx handle karega
  gridSize: 'small' | 'medium' | 'large';
  onImageClick: (image: LocalImage) => void;
  favorites: number[];            // Favorites ka array
  onToggleFavorite: (id: number) => void; // Favorite toggle karne ka function
}

export default function Gallery({ 
  photos, 
  isLoading, 
  gridSize, 
  onImageClick, 
  favorites, 
  onToggleFavorite 
}: GalleryProps) {

  // Group images by date using the passed 'photos' prop
  const groupedImages = useMemo(() => {
    const groups: { [key: string]: LocalImage[] } = {};

    photos.forEach(img => {
      const date = new Date(img.timestamp * 1000);
      const dateString = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(img);
    });

    return Object.entries(groups).map(([date, imgs]) => ({
      date,
      images: imgs
    }));
  }, [photos]);

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
        <p className="text-sm">Go to Settings and sync a folder with images.</p>
      </div>
    );
  }

  return (
    <main className="relative z-10 w-full max-w-7xl mx-auto pb-12 space-y-12">
      {groupedImages.map((group) => (
        <div key={group.date} className="w-full relative">

          {/* THE FLOATING PILL HEADER */}
          <div className="sticky top-4 z-30 flex justify-start mb-6 pointer-events-none">
            <div className="bg-[#0a0a0c]/70 backdrop-blur-3xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] pointer-events-auto transition-all duration-300 hover:bg-[#121214]/90 hover:border-purple-500/40 group">
              <div className="bg-purple-500/10 p-1.5 rounded-full text-purple-400 group-hover:text-purple-300 transition-colors">
                <CalendarDays size={16} />
              </div>
              <h2 className="text-sm font-bold tracking-wide text-white/90 group-hover:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {group.date}
              </h2>
              <div className="text-[11px] font-semibold tracking-wider text-purple-200 bg-purple-500/20 px-2.5 py-1 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                {group.images.length}
              </div>
            </div>
          </div>

          {/* THE ROUNDED "SQUIRCLE" GRID */}
          <div className="flex flex-wrap gap-3 sm:gap-4 after:content-[''] after:flex-grow-[10] after:h-0">
            {group.images.map((item) => {
              // Check if image is in favorites
              const isFav = favorites.includes(item.id);

              return (
                <motion.div 
                  layout 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 200, damping: 26, mass: 0.8 },
                    default: { duration: 0.3 }
                  }}
                  key={item.id} 
                  className={`relative group flex-grow shrink-0 basis-auto min-w-[20%] max-w-full
                    ${gridSize === 'small' ? 'h-32 sm:h-40' : gridSize === 'medium' ? 'h-48 sm:h-64' : 'h-72 sm:h-[400px]'}
                  `}
                >
                  {/* TRUE AMBIENT GLOW */}
                  <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1.5s] ease-out pointer-events-none">
                    <img 
                      src={item.url} 
                      alt="glow" 
                      decoding="async"
                      loading="lazy"
                      className="w-full h-full object-cover rounded-[1.75rem] blur-[40px] saturate-200 brightness-110"
                    />
                  </div>

                  {/* MAIN IMAGE CONTAINER */}
                  <div 
                    onClick={() => onImageClick(item)}
                    style={{ contentVisibility: 'auto' }} 
                    className="relative overflow-hidden cursor-pointer bg-[#121214] rounded-[1.75rem] border border-white/[0.04] w-full h-full hover:border-white/10 transition-colors duration-300 z-10"
                  >
                    <motion.img 
                      layoutId={`image-${item.id}`}
                      src={item.url} 
                      alt={`Gallery image`} 
                      loading="lazy"
                      decoding="async"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "100px" }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>

                    {/* Pill-shaped Action Button (FAVORITE TOGGLE) */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 translate-y-[-10px] group-hover:translate-y-0">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); // Image open hone se rokne ke liye
                          onToggleFavorite(item.id); 
                        }}
                        className="p-2.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:border-white/30 text-white shadow-xl transition-all"
                      >
                        {/* Dynamic Star icon based on state */}
                        <Star 
                          size={16} 
                          fill={isFav ? "currentColor" : "none"} 
                          className={isFav ? "text-yellow-400" : "text-white"} 
                        />
                      </button>
                    </div>

                    {/* Pill-shaped View Badge */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 scale-90 group-hover:scale-100">
                      <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-full text-[11px] font-bold tracking-widest text-white shadow-2xl hover:bg-white hover:text-black transition-colors duration-300">
                        OPEN
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>

        </div>
      ))}
    </main>
  );
}