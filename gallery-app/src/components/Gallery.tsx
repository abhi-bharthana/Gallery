import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Image as ImageIcon, CalendarDays } from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';

interface GalleryProps {
  gridSize: 'small' | 'medium' | 'large';
  onImageClick: (image: { id: number, url: string }) => void;
}

interface BackendImage {
  url: string;
  timestamp: number;
}

interface LocalImage {
  id: number;
  url: string;
  timestamp: number;
}

export default function Gallery({ gridSize, onImageClick }: GalleryProps) {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const saved = localStorage.getItem('synced_folders');
        const directories = saved ? JSON.parse(saved) : [];

        if (directories.length === 0) {
          setIsLoading(false);
          return;
        }

        const fileData: BackendImage[] = await invoke('fetch_synced_images', { directories });

        const loaded = fileData.map((img, i) => ({
          id: i + 1,
          url: convertFileSrc(img.url),
          timestamp: img.timestamp,
        }));

        setImages(loaded);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const groupedImages = useMemo(() => {
    const groups: { [key: string]: LocalImage[] } = {};

    images.forEach(img => {
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
  }, [images]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-purple-400">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-sm">Organizing timeline...</p>
      </div>
    );
  }

  if (images.length === 0) {
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
            {group.images.map((item) => (
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
                {/* 
                  TRUE AMBIENT GLOW (YouTube Style)
                  Hum same image ko container ke peeche render kar rahe hain aur usko blur kar rahe hain.
                  Saturate-200 aur brightness se colors pop honge.
                  ADDED: decoding="async" for smooth scrolling
                */}
                <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1.5s] ease-out pointer-events-none">
                  <img 
                    src={item.url} 
                    alt="glow" 
                    decoding="async" // Scroll stutter rokne ke liye
                    loading="lazy"
                    className="w-full h-full object-cover rounded-[1.75rem] blur-[40px] saturate-200 brightness-110"
                  />
                </div>

                {/* MAIN IMAGE CONTAINER */}
                <div 
                  onClick={() => onImageClick(item)}
                  // ADDED: content-visibility auto limits rendering of offscreen elements
                  style={{ contentVisibility: 'auto' }} 
                  className="relative overflow-hidden cursor-pointer bg-[#121214] rounded-[1.75rem] border border-white/[0.04] w-full h-full hover:border-white/10 transition-colors duration-300 z-10"
                >
                  <motion.img 
                    layoutId={`image-${item.id}`} // Modal ke liye smooth popup
                    src={item.url} 
                    alt={`Gallery image`} 
                    loading="lazy"
                    decoding="async" // Yahan bhi zaroori hai
                    // ADDED: Smooth fade in for lazy-loaded images instead of abrupt pop
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "100px" }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>

                  {/* Pill-shaped Action Button */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 translate-y-[-10px] group-hover:translate-y-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-2.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:border-white/30 text-white shadow-xl transition-all"
                    >
                      <Star size={16} />
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
            ))}
          </div>

        </div>
      ))}
    </main>
  );
}