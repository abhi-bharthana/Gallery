// src/components/Gallery/GalleryItem.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2, Check, RotateCcw, Video } from 'lucide-react';
import Thumbnail from './Thumbnail';
import { LocalImage } from '../../hooks/useGalleryData';

// ... (interface aur baaki ka code same rahega) ...

export default function GalleryItem({ 
  item, gridSize, isFav, isSelected, isSelectionMode, isTrashView, 
  onImageClick, toggleSelect, onPointerDown, onPointerEnter, 
  onToggleFavorite, onDelete, onRestore 
}: GalleryItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const ratio = (item.width && item.height) ? (item.width / item.height) : 1.5;
  const sizeClasses = 
    gridSize === 'small' ? 'h-32 sm:h-40' : 
    gridSize === 'medium' ? 'h-48 sm:h-64' : 
    'h-72 sm:h-[400px]';
  
  const baseHeight = gridSize === 'small' ? 160 : gridSize === 'medium' ? 256 : 400;
  const flexBasis = baseHeight * ratio;

  const isVideo = item.type === 'video' || !!item.filename?.match(/\.(mp4|mkv|mov|webm|hevc)$/i);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ 
        aspectRatio: `${ratio}`,
        flexGrow: ratio,
        flexBasis: `${flexBasis}px`
      }}
      className={`relative group shrink-0 max-w-full ${sizeClasses}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🔥 FIX: 'div' ko 'motion.div' banaya aur layoutId lagaya 🔥 */}
      <motion.div 
        layoutId={`media-${item.id}`} // <-- YE HAI JADOO WALI LINE
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey || isSelectionMode) {
            e.stopPropagation();
            toggleSelect(item.id);
          } else {
            onImageClick(item);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        className={`relative overflow-hidden cursor-pointer bg-[#121214] rounded-[1.75rem] border w-full h-full transition-all duration-300 z-10 ${
          isSelected 
            ? 'border-purple-500 scale-[0.95] shadow-[0_0_30px_rgba(168,85,247,0.3)]' 
            : 'border-white/[0.04] hover:border-white/10 hover:shadow-xl'
        }`}
      >
        {/* Uske andar ka saara code same rahega (Thumbnail, Video Title, Buttons etc) */}
        <Thumbnail image={item} gridSize={gridSize} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        
        {isVideo && (
          <div className="absolute top-3 left-3 right-14 z-20 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 pl-3 pr-1 py-1.5 rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.6)] overflow-hidden">
              <Video size={14} className="text-purple-400 shrink-0 drop-shadow-md" />
              
              <div className="flex-1 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
                <motion.div
                  animate={{ x: isHovered ? ["0%", "-50%"] : "0%" }}
                  transition={{ repeat: Infinity, ease: "linear", duration: Math.max(6, item.filename.length * 0.15) }}
                  className="flex whitespace-nowrap gap-8 w-max"
                >
                  <span className="text-white/95 text-xs font-semibold tracking-wide drop-shadow-md">{item.filename}</span>
                  <span className="text-white/95 text-xs font-semibold tracking-wide drop-shadow-md">{item.filename}</span>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
        
        {isSelected && (
          <div className="absolute top-4 left-4 z-30 bg-purple-500 text-white rounded-full p-1.5 shadow-lg scale-100">
            <Check size={16} strokeWidth={3} />
          </div>
        )}

        <div className={`absolute top-4 right-4 flex flex-col gap-2 transition-all duration-300 z-30 translate-y-[-10px] group-hover:translate-y-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {/* ... Action buttons ... */}
        </div>
      </motion.div>
    </motion.div>
  );
}