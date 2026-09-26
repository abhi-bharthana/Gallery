// src/components/Gallery/GalleryItem.tsx
import { motion } from 'framer-motion';
import { Star, Trash2, Check, RotateCcw } from 'lucide-react';
import Thumbnail from './Thumbnail';
import { LocalImage } from '../../hooks/useGalleryData';

interface GalleryItemProps {
  item: LocalImage;
  gridSize: 'small' | 'medium' | 'large';
  isFav: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  isTrashView?: boolean;
  onImageClick: (item: LocalImage) => void;
  toggleSelect: (id: string) => void;
  onPointerDown: () => void;
  onPointerEnter: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

export default function GalleryItem({ 
  item, gridSize, isFav, isSelected, isSelectionMode, isTrashView, 
  onImageClick, toggleSelect, onPointerDown, onPointerEnter, 
  onToggleFavorite, onDelete, onRestore 
}: GalleryItemProps) {
  
  const ratio = (item.width && item.height) ? (item.width / item.height) : 1.5;
  
  const sizeClasses = 
    gridSize === 'small' ? 'h-32 sm:h-40' : 
    gridSize === 'medium' ? 'h-48 sm:h-64' : 
    'h-72 sm:h-[400px]';

  const baseHeight = gridSize === 'small' ? 160 : gridSize === 'medium' ? 256 : 400;
  const flexBasis = baseHeight * ratio;

  return (
    <motion.div
      // 🔥 Layout animation hata di hai taaki heavy re-calculations aur UI freezes na hon
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ 
        aspectRatio: `${ratio}`,
        flexGrow: ratio,
        flexBasis: `${flexBasis}px`
      }}
      className={`relative group shrink-0 max-w-full ${sizeClasses}`}
    >
      <div 
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
        {/* 🔥 Sirf ek hi lightweight Thumbnail render hoga (Double load khatam) */}
        <Thumbnail image={item} gridSize={gridSize} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
        
        {isSelected && (
          <div className="absolute top-4 left-4 z-20 bg-purple-500 text-white rounded-full p-1.5 shadow-lg scale-100">
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
}