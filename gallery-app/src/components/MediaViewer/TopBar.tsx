// src/components/MediaViewer/TopBar.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Star, Trash2, RotateCcw, FolderPlus, Info, 
  Expand, Shrink, Play, Pause, MoreHorizontal,
  Crop, Share, Copy, FolderOutput, Edit3, Monitor, ExternalLink, ChevronRight, Video
} from 'lucide-react';

export default function TopBar({ 
  image,
  isFavorite, isTrashed, albums, 
  showInfo, setShowInfo, 
  isCover, setIsCover, 
  isAutoPlaying, setIsAutoPlaying,
  onClose, onToggleFavorite, onDelete, onRestore, onAddToAlbum,
  isExternal 
}: any) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAlbums, setShowAlbums] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Video Check Logic
  const isVideo = image?.type === 'video' || image?.filename?.match(/\.(mp4|mkv|mov|webm|hevc)$/i);

  // Bahar click karne par menu close karne ka logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowAlbums(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Styling helpers
  const iconBtnStyle = "p-2.5 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/10";
  const activeIconBtnStyle = "p-2.5 text-purple-400 bg-purple-500/20 rounded-full transition-colors";

  return (
    // 🔥 NAYA LAYOUT: Full width wrapper with pointer-events-none taaki neeche ki image click ho sake
    <div className="fixed top-0 left-0 w-full p-6 flex items-start justify-between z-[1001] pointer-events-none">
      
      {/* 🔥 LEFT CORNER: Video Title */}
      <div className="flex-1 min-w-0 pr-4 pointer-events-auto">
        {isVideo && (
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.8)] max-w-full">
            <Video size={18} className="text-purple-400 shrink-0" />
            <span className="text-sm font-semibold text-white/95 truncate tracking-wide drop-shadow-md" title={image?.filename}>
              {image?.filename}
            </span>
          </div>
        )}
      </div>

      {/* 🔥 RIGHT CORNER: Controls & Close Button */}
      <div className="flex items-center gap-3 pointer-events-auto shrink-0" onClick={(e) => e.stopPropagation()}>
        
        {/* Compact Floating Pill Menu */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
          
          {/* Slideshow Play/Pause: SIRF IMAGES KE LIYE */}
          {!isVideo && (
            <button 
              onClick={() => setIsAutoPlaying(!isAutoPlaying)} 
              className={isAutoPlaying ? activeIconBtnStyle : iconBtnStyle}
              title="Autoplay (Space)"
            >
              {isAutoPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
          )}

          {/* Expand/Shrink */}
          <button 
            onClick={() => setIsCover(!isCover)} 
            className={isCover ? activeIconBtnStyle : iconBtnStyle}
            title={isCover ? "Fit to View" : "Fill Screen"}
          >
            {isCover ? <Shrink size={20} /> : <Expand size={20} />}
          </button>

          {/* Info */}
          <button 
            onClick={() => setShowInfo(!showInfo)} 
            className={showInfo ? activeIconBtnStyle : iconBtnStyle}
            title="Details"
          >
            <Info size={20} />
          </button>

          {/* EXTERNAL HIDE: Favorite or Restore */}
          {!isExternal && (
            isTrashed ? (
              <button onClick={onRestore} className={iconBtnStyle} title="Restore">
                <RotateCcw size={20} />
              </button>
            ) : (
              <button onClick={onToggleFavorite} className={iconBtnStyle} title="Favorite">
                <Star size={20} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-yellow-400" : ""} />
              </button>
            )
          )}

          {/* More Options Dropdown */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => { setShowMenu(!showMenu); setShowAlbums(false); }} 
              className={`p-2.5 rounded-full transition-colors ${showMenu ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
            >
              <MoreHorizontal size={20} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-3 w-56 bg-[#1a1a1c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 flex flex-col z-[1002]"
                >
                  {!isTrashed && !isExternal && (
                    <>
                      {!isVideo && <MenuItem icon={Crop} label="Edit" hasArrow />}
                      
                      {/* Add To with nested Albums menu */}
                      <div 
                        className="relative" 
                        onMouseEnter={() => setShowAlbums(true)}
                        onMouseLeave={() => setShowAlbums(false)}
                      >
                        <MenuItem icon={FolderPlus} label="Add to" hasArrow />
                        
                        <AnimatePresence>
                          {showAlbums && (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-0 right-full mr-2 w-48 bg-[#1a1a1c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[1003]"
                            >
                              <div className="px-3 py-1.5 border-b border-white/5 mb-1">
                                <p className="text-xs font-semibold text-gray-400 tracking-wider">ALBUMS</p>
                              </div>
                              {albums.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-gray-500 italic">No albums</p>
                              ) : (
                                albums.map((album: any) => (
                                  <button 
                                    key={album.id} 
                                    onClick={() => { onAddToAlbum(album.id); setShowMenu(false); setShowAlbums(false); }} 
                                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:text-white hover:bg-purple-500/20 transition-colors truncate"
                                  >
                                    {album.name}
                                  </button>
                                ))
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <MenuItem icon={Share} label="Share" />
                      <MenuItem icon={Copy} label="Copy" />
                      <MenuItem icon={FolderOutput} label="Move" />
                      <MenuItem icon={Edit3} label="Rename" />
                      
                      {!isVideo && <MenuItem icon={Monitor} label="Set as wallpaper" />}
                      
                      <MenuItem icon={ExternalLink} label="Open with" hasArrow />
                    </>
                  )}
                  
                  <MenuItem icon={Info} label="Details" onClick={() => { setShowInfo(true); setShowMenu(false); }} />
                  
                  {!isExternal && (
                    <>
                      <div className="h-px bg-white/10 my-1 mx-2"></div>
                      
                      <button 
                        onClick={() => { onDelete(); setShowMenu(false); }} 
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-red-400"
                      >
                        <Trash2 size={16} className="opacity-80" />
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 🔥 HIGH CONTRAST CLOSE BUTTON 🔥 */}
        <button 
          onClick={onClose} 
          className="p-2.5 text-gray-200 hover:text-white bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.8)] rounded-full transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// 📌 Helper Component: Dropdown Menu Item
const MenuItem = ({ icon: Icon, label, hasArrow, onClick, onMouseEnter }: any) => (
  <button 
    onClick={onClick} 
    onMouseEnter={onMouseEnter}
    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
  >
    <div className="flex items-center gap-3">
      <Icon size={16} className="opacity-70" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {hasArrow && <ChevronRight size={14} className="opacity-40" />}
  </button>
);