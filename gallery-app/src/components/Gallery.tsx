import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface GalleryProps {
  gridSize: 'small' | 'medium' | 'large';
  onImageClick: (image: {id: number, url: string}) => void;
}

export default function Gallery({ gridSize, onImageClick }: GalleryProps) {
  const sampleImages = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    url: `https://picsum.photos/seed/${i + 15}/800/1000`,
    isTall: i % 4 === 0,
    isMedium: i % 3 === 0
  }));

  const getGridColumns = () => {
    switch (gridSize) {
      case 'small': return 'columns-3 sm:columns-4 lg:columns-6 gap-3 space-y-3';
      case 'medium': return 'columns-2 sm:columns-3 lg:columns-4 gap-5 space-y-5';
      case 'large': return 'columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6';
      default: return 'columns-2 sm:columns-3 lg:columns-4 gap-5 space-y-5';
    }
  };

  return (
    <main className={`relative z-10 w-full max-w-7xl mx-auto pb-10 transition-all duration-500 ${getGridColumns()}`}>
      {sampleImages.map((item) => (
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ layout: { type: "spring", stiffness: 250, damping: 28 } }}
          key={item.id} 
          onClick={() => onImageClick(item)}
          className="break-inside-avoid relative rounded-[1.25rem] overflow-hidden cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.3)] bg-[#121214] border border-white/[0.03] hover:border-purple-500/30 transition-colors duration-300"
        >
          <div className={`w-full relative overflow-hidden ${item.isTall ? 'h-80' : item.isMedium ? 'h-64' : 'h-56'}`}>
            
            {/* YAHAN LAYOUT ID LAGA HAI */}
            <motion.img 
              layoutId={`image-${item.id}`}
              src={item.url} 
              alt={`Gallery image ${item.id}`} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 backdrop-blur-[2px]"></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 scale-90 group-hover:scale-100">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full text-xs font-semibold tracking-wider text-white shadow-xl hover:bg-white/20 transition-colors">
                VIEW
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </main>
  );
}