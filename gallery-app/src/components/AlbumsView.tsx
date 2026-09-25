import { motion } from 'framer-motion';
import { Plus, FolderHeart } from 'lucide-react';
import { Album, LocalImage } from '../hooks/useGalleryData';

interface AlbumsViewProps {
  albums: Album[];
  allPhotos: LocalImage[];
  onCreateAlbum: () => void;
  onSelectAlbum: (id: string) => void;
}

export default function AlbumsView({ albums, allPhotos, onCreateAlbum, onSelectAlbum }: AlbumsViewProps) {
  return (
    <div className="max-w-7xl mx-auto">
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
          <p className="text-sm text-gray-600 mt-1">Create one to start grouping your photos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map((album) => {
            const coverPhoto = allPhotos.find((p) => album.photos.includes(p.id));

            return (
              <motion.div
                layout
                key={album.id}
                onClick={() => onSelectAlbum(album.id)}
                className="relative group cursor-pointer aspect-[4/3] rounded-[1.75rem] overflow-hidden bg-[#121214] border border-white/[0.04] hover:border-purple-500/40 transition-all duration-500 shadow-xl hover:shadow-[0_10px_40px_rgba(168,85,247,0.15)] flex flex-col justify-end"
              >
                {coverPhoto ? (
                  <img
                    src={coverPhoto.url}
                    alt={album.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-[1.5s] ease-out"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/5 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                    <FolderHeart size={40} className="text-purple-500/30 group-hover:text-purple-400/50 transition-colors duration-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10 pointer-events-none"></div>
                <div className="relative z-20 p-5 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="bg-white/10 backdrop-blur-md w-fit px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-white mb-2 shadow-lg border border-white/10">
                    {album.photos.length} {album.photos.length === 1 ? 'ITEM' : 'ITEMS'}
                  </div>
                  <h3 className="font-bold text-xl text-white tracking-wide truncate drop-shadow-md group-hover:text-purple-300 transition-colors duration-300">
                    {album.name}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}