// src/components/Gallery/GalleryItem.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
// 🔥 NAYA: 'Image as ImageIcon' import kiya taaki photos ke liye icon dikha sakein
import { Star, Trash2, Check, RotateCcw, Video, Image as ImageIcon } from 'lucide-react'; 
import Thumbnail from './Thumbnail';
import { LocalImage } from '../../hooks/useGalleryData';

export interface GalleryItemProps {
  item: LocalImage;
  gridSize: 'small' | 'medium' | 'large';
  isFav: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  isTrashView?: boolean;
  progressPercent?: number; 
  onImageClick: (image: LocalImage) => void;
  toggleSelect: (id: string) => void;
  onPointerDown: () => void;
  onPointerEnter: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

export default function GalleryItem({ 
  item, gridSize, isFav, isSelected, isSelectionMode, isTrashView, progressPercent,
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
        flexBasis: `${flexBasis}px`,
      }}
      className={`relative group shrink-0 max-w-full z-10 hover:z-0 transition-all duration-300 ${sizeClasses}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        layoutId={`media-${item.id}`}
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
        className={`relative cursor-pointer rounded-[1.75rem] border w-full h-full transition-all duration-300 z-10 ${
          isSelected 
            ? 'border-purple-500 scale-[0.95] shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-[#121214]' 
            : 'border-white/[0.04] hover:border-white/10 hover:shadow-xl'
        }`}
      >
        <Thumbnail image={item} gridSize={gridSize} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        
        {/* 🔥 PREMIUM TITLE PILL (Video = Always Show, Photo = Hover Only) 🔥 */}
        <div className={`absolute bottom-4 left-4 right-16 z-20 pointer-events-none transition-all duration-400 ease-out flex ${
          isVideo ? 'opacity-100' : 'opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0'
        }`}>
          {/* Box ko inline-flex aur rounded-full diya taaki exact Pill shape aaye */}
          <div className="inline-flex items-center gap-2.5 bg-black/80 backdrop-blur-xl border border-white/10 pl-3 pr-4 py-1.5 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.8)] overflow-hidden max-w-full">
            {isVideo ? (
              <Video size={14} className="text-purple-400 shrink-0 drop-shadow-md" />
            ) : (
              <ImageIcon size={14} className="text-blue-400 shrink-0 drop-shadow-md" />
            )}
            
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

        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-white/20 z-30 pointer-events-none overflow-hidden rounded-b-[1.75rem]">
            <div 
              className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] rounded-r-full transition-all duration-500" 
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none rounded-[1.75rem]"></div>
        
        {isSelected && (
          <div className="absolute top-4 left-4 z-30 bg-purple-500 text-white rounded-full p-1.5 shadow-lg scale-100">
            <Check size={16} strokeWidth={3} />
          </div>
        )}

        {/* Action Buttons */}
        <div className={`absolute top-4 right-4 flex flex-col gap-2 transition-all duration-300 z-30 translate-y-[-10px] group-hover:translate-y-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {!isTrashView && (
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 hover:bg-black/60 hover:scale-110 hover:text-yellow-400 transition-all active:scale-95 shadow-xl">
              <Star size={16} className={isFav ? "fill-yellow-400 text-yellow-400" : ""} />
            </button>
          )}
          {isTrashView && onRestore ? (
            <button onClick={(e) => { e.stopPropagation(); onRestore(item.id); }} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-green-400 hover:bg-green-500/20 hover:scale-110 transition-all active:scale-95 shadow-xl">
              <RotateCcw size={16} />
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-red-400 hover:bg-red-500/20 hover:scale-110 transition-all active:scale-95 shadow-xl">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}