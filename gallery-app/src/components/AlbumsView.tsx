// src/components/AlbumsView.tsx
import { motion } from 'framer-motion';
import { Plus, FolderHeart } from 'lucide-react';
import { Album, LocalImage } from '../hooks/useGalleryData';
import Thumbnail from './Gallery/Thumbnail'; // 🔥 NAYA IMPORT: Broken images fix karne ke liye

interface AlbumsViewProps {
  albums: Album[];
  allPhotos: LocalImage[];
  onCreateAlbum: () => void;
  onSelectAlbum: (id: string) => void;
}

export default function AlbumsView({ albums, allPhotos, onCreateAlbum, onSelectAlbum }: AlbumsViewProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-wide text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            My Albums
          </h2>
          <p className="text-gray-400 text-sm mt-1">Organize your favorite moments</p>
        </div>
        
        <button
          onClick={onCreateAlbum}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-full backdrop-blur-md transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:border-purple-500/40"
        >
          <Plus size={18} />
          <span className="font-semibold text-sm tracking-wide">Create Album</span>
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
          <FolderHeart size={48} className="text-gray-600 mb-4" />
          <p className="text-lg text-gray-300 font-medium">No albums yet</p>
          <p className="text-sm text-gray-600 mt-1">Create or sync a folder to start grouping your photos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {albums.map((album) => {
            const mediaItems = allPhotos.filter((p) => album.photos.includes(p.id));
            const videoCount = mediaItems.filter(p => p.type === 'video' || !!p.filename?.match(/\.(mp4|mkv|mov|webm|hevc)$/i)).length;
            const imageCount = mediaItems.length - videoCount;
            const coverPhoto = mediaItems[0];
            const isAuto = album.id.startsWith('auto-album-');

            return (
              <motion.div
                layout
                key={album.id}
                onClick={() => onSelectAlbum(album.id)}
                className="relative group cursor-pointer aspect-square rounded-[2rem] overflow-hidden bg-[#121214] border border-white/[0.05] hover:border-purple-500/30 transition-all duration-500 shadow-2xl hover:shadow-[0_15px_40px_rgba(168,85,247,0.15)] flex flex-col"
              >
                {/* 🔥 TOP HALF: Perfect Cover Image with Thumbnail Component */}
                <div className="absolute inset-0 w-full h-full bg-[#121214]">
                  {coverPhoto ? (
                    <Thumbnail 
                      image={coverPhoto} 
                      gridSize="medium" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-transparent">
                      <FolderHeart size={48} className="text-purple-500/20" />
                    </div>
                  )}
                </div>

                {/* 🔥 BOTTOM HALF: Sleek Folder Tab (Clip-Path) */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[55%] bg-[#1a1a1c] z-10 flex flex-col justify-end p-6 transition-colors duration-500 group-hover:bg-[#1e1e22]"
                  style={{ 
                    // Ye exact shape banayega jisme left side uchi (tab) hogi aur right side thodi neeche hogi
                    clipPath: 'polygon(0 0, 35% 0, 42% 18%, 100% 18%, 100% 100%, 0 100%)' 
                  }}
                >
                  <div className="mt-4 flex flex-col h-full justify-between">
                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="font-bold text-lg text-white tracking-wide truncate group-hover:text-purple-300 transition-colors duration-300">
                        {album.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">
                        {isAuto ? 'Auto-Synced Folder' : 'Custom Album'}
                      </p>
                    </div>

                    {/* Stats Row (Premium Typography Match) */}
                    <div className="flex items-end justify-between mt-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white tracking-tighter leading-none">
                          {imageCount < 10 ? `0${imageCount}` : imageCount}
                        </span>
                        <span className="text-[12px] text-gray-400 font-semibold tracking-wide">
                          Images
                        </span>
                      </div>

                      <div className="text-[12px] text-gray-400 font-medium tracking-wide pb-0.5">
                        {videoCount} Videos
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}