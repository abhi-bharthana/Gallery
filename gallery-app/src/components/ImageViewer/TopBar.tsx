// src/components/ImageViewer/TopBar.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Trash2, RotateCcw, FolderPlus, Info, Maximize, Minimize, Expand, Shrink, Play, Pause } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export default function TopBar({ 
  image, isFavorite, isTrashed, albums, 
  showInfo, setShowInfo, 
  isCover, setIsCover, 
  isAutoPlaying, setIsAutoPlaying, // Naye props
  onClose, onToggleFavorite, onDelete, onRestore, onAddToAlbum 
}: any) {
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    getCurrentWindow().isFullscreen().then(setIsFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    const appWindow = getCurrentWindow();
    const isFull = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFull);
    setIsFullscreen(!isFull);
  };

  return (
    <div className="fixed top-6 right-6 flex items-center gap-4 z-[1001]" onClick={(e) => e.stopPropagation()}>
      
      {/* 🔥 AUTOPLAY BUTTON 🔥 */}
      <button 
        onClick={() => setIsAutoPlaying(!isAutoPlaying)} 
        className={`p-3 rounded-full border backdrop-blur-md transition-all shadow-lg ${isAutoPlaying ? 'bg-purple-500/30 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
        title={isAutoPlaying ? "Pause Slideshow (Spacebar)" : "Play Slideshow (Spacebar)"}
      >
        {isAutoPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>

      {/* Fill/Fit Screen Button */}
      <button 
        onClick={() => setIsCover(!isCover)} 
        className={`p-3 rounded-full border backdrop-blur-md transition-all shadow-lg ${isCover ? 'bg-purple-500/30 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
        title={isCover ? "Fit to View" : "Fill Screen"}
      >
        {isCover ? <Shrink size={18} /> : <Expand size={18} />}
      </button>

      {/* Fullscreen Button */}
      <button onClick={toggleFullscreen} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md transition-all shadow-lg" title="App Fullscreen">
        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
      </button>

      <button onClick={() => setShowInfo(!showInfo)} className={`p-3 rounded-full border backdrop-blur-md transition-all shadow-lg ${showInfo ? 'bg-purple-500/30 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}>
        <Info size={18} />
      </button>

      {isTrashed ? (
        <button onClick={onRestore} className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-green-500/20 hover:text-green-400 text-white backdrop-blur-md transition-all group shadow-lg">
          <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
          <span className="text-sm font-semibold tracking-wide">Restore</span>
        </button>
      ) : (
        <>
          <button onClick={onToggleFavorite} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md transition-all group shadow-lg">
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} className={`transition-transform group-hover:scale-110 ${isFavorite ? "text-yellow-400" : ""}`} />
          </button>
          
          <div className="relative">
            <button onClick={() => setShowAlbumMenu(!showAlbumMenu)} className={`p-3 rounded-full border backdrop-blur-md transition-all shadow-lg ${showAlbumMenu ? 'bg-purple-500/30 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}>
              <FolderPlus size={18} />
            </button>
            <AnimatePresence>
              {showAlbumMenu && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full mt-3 right-0 w-48 bg-[#121214]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[1002] flex flex-col p-1">
                  <div className="px-3 py-2 border-b border-white/5 mb-1"><p className="text-xs font-semibold text-gray-400 tracking-wider">ADD TO ALBUM</p></div>
                  {albums.length === 0 ? <p className="px-3 py-4 text-sm text-gray-500 text-center italic">No albums</p> : albums.map((album: any) => (
                    <button key={album.id} onClick={() => { onAddToAlbum(album.id); setShowAlbumMenu(false); }} className="text-left px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 rounded-lg transition-colors truncate">{album.name}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button onClick={onDelete} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-white backdrop-blur-md transition-all group shadow-lg">
            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
      
      <button onClick={onClose} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all group shadow-lg">
        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}