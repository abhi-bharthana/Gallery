import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Star, Trash2, RotateCcw, FolderPlus } from 'lucide-react';

interface LocalImage {
  id: number;
  url: string;
}

interface Album {
  id: string;
  name: string;
}

interface ImageViewerProps {
  image: LocalImage;
  isFavorite: boolean;
  isTrashed: boolean;
  albums: Album[];
  onClose: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onAddToAlbum: (albumId: string) => void;
}

export default function ImageViewer({ 
  image, 
  isFavorite, 
  isTrashed, 
  albums,
  onClose, 
  onToggleFavorite, 
  onDelete, 
  onRestore,
  onAddToAlbum
}: ImageViewerProps) {
  
  // Dropdown menu toggle karne ke liye state
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);

  return (
    <>
      {/* 1. SOLID BACKGROUND */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-3xl"
        onClick={onClose}
      />

      {/* 2. TOP ACTION BAR */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ delay: 0.1, ease: "easeOut" }}
        className="fixed top-6 right-6 flex items-center gap-4 z-[1001]"
      >
        {isTrashed ? (
          <button 
            onClick={onRestore}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-400 text-white backdrop-blur-md transition-all group shadow-lg"
          >
            <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
            <span className="text-sm font-semibold tracking-wide">Restore</span>
          </button>
        ) : (
          <>
            <button 
              onClick={onToggleFavorite}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md transition-all group shadow-lg"
            >
              <Star 
                size={18} 
                fill={isFavorite ? "currentColor" : "none"} 
                className={`transition-transform group-hover:scale-110 ${isFavorite ? "text-yellow-400" : ""}`} 
              />
            </button>

            {/* ALBUM DROPDOWN BUTTON */}
            <div className="relative">
              <button 
                onClick={() => setShowAlbumMenu(!showAlbumMenu)}
                className={`p-3 rounded-full border backdrop-blur-md transition-all group shadow-lg ${showAlbumMenu ? 'bg-purple-500/30 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
              >
                <FolderPlus size={18} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* DROPDOWN MENU */}
              <AnimatePresence>
                {showAlbumMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-3 right-0 w-48 bg-[#121214]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col p-1"
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs font-semibold text-gray-400 tracking-wider">ADD TO ALBUM</p>
                    </div>
                    
                    {albums.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-gray-500 text-center italic">No albums created</p>
                    ) : (
                      albums.map(album => (
                        <button
                          key={album.id}
                          onClick={() => {
                            onAddToAlbum(album.id);
                            setShowAlbumMenu(false); // Menu close karo
                          }}
                          className="text-left px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 rounded-lg transition-colors truncate"
                        >
                          {album.name}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md transition-all group shadow-lg">
              <Share2 size={18} className="group-hover:scale-110 transition-transform" />
            </button>

            <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-purple-500/30 hover:border-purple-500/50 hover:text-purple-300 text-white backdrop-blur-md transition-all group shadow-lg">
              <Download size={18} className="group-hover:scale-110 transition-transform" />
            </button>

            <div className="w-[1px] h-6 bg-white/20 mx-1"></div>

            <button 
              onClick={onDelete}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 text-white backdrop-blur-md transition-all group shadow-lg"
            >
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </>
        )}

        <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
        <button 
          onClick={onClose}
          className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all group shadow-lg"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </motion.div>

      {/* 3. THE IMAGE WRAPPER (With Drag Gestures) */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-10 pointer-events-none">
        <motion.img 
          layoutId={`image-${image.id}`}
          src={image.url} 
          alt="Full screen preview" 
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.8}
          onDragEnd={(e, { offset, velocity }) => {
            if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
              onClose();
            }
          }}
          className="pointer-events-auto max-w-full max-h-full object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.05)] rounded-lg cursor-grab active:cursor-grabbing"
        />
      </div>
    </>
  );
}