import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar';
import Gallery from './components/Gallery';
import ImageViewer from './components/ImageViewer';
import FolderManager from './components/FolderManager';

interface LocalImage {
  id: number;
  url: string;
  timestamp: number;
}

interface Album {
  id: string;
  name: string;
  photos: number[];
}

export default function App() {
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [activeTab, setActiveTab] = useState('All Photos');
  const [selectedImage, setSelectedImage] = useState<LocalImage | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // --- GLOBAL STATE ---
  const [allPhotos, setAllPhotos] = useState<LocalImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Persistent States (Saved in LocalStorage)
  const [favorites, setFavorites] = useState<number[]>(() => JSON.parse(localStorage.getItem('auvem_favs') || '[]'));
  const [trash, setTrash] = useState<number[]>(() => JSON.parse(localStorage.getItem('auvem_trash') || '[]'));
  const [albums, setAlbums] = useState<Album[]>(() => JSON.parse(localStorage.getItem('auvem_albums') || '[]'));

  // Save states to local storage on change
  useEffect(() => localStorage.setItem('auvem_favs', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('auvem_trash', JSON.stringify(trash)), [trash]);
  useEffect(() => localStorage.setItem('auvem_albums', JSON.stringify(albums)), [albums]);

  // Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // F11 Fullscreen
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'F11' || e.code === 'F11') {
        e.preventDefault(); 
        try {
          const appWindow = getCurrentWindow();
          const isCurrentlyFullscreen = await appWindow.isFullscreen();
          await appWindow.setFullscreen(!isCurrentlyFullscreen);
        } catch (error) {
          console.error("F11 Error:", error);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- FETCH IMAGES FROM RUST BACKEND ---
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const saved = localStorage.getItem('synced_folders');
        const directories = saved ? JSON.parse(saved) : [];

        if (directories.length === 0) {
          setIsLoading(false);
          return;
        }

        const fileData: any[] = await invoke('fetch_synced_images', { directories });
        const loaded = fileData.map((img, i) => ({
          id: i + 1, // Ensure unique ID (better if backend sends a unique hash)
          url: convertFileSrc(img.url),
          timestamp: img.timestamp,
        }));

        setAllPhotos(loaded);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  // --- ACTIONS ---
  const handleToggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
  };

  const handleMoveToTrash = (id: number) => {
    setTrash(prev => [...prev, id]);
    setFavorites(prev => prev.filter(fId => fId !== id)); // Remove from favs if trashed
    setSelectedImage(null);
  };

  const handleRestoreFromTrash = (id: number) => {
    setTrash(prev => prev.filter(tId => tId !== id));
    setSelectedImage(null);
  };

  const handleCreateAlbum = () => {
    const albumName = prompt("Enter new album name:");
    if (albumName && albumName.trim() !== "") {
      const newAlbum: Album = { id: Date.now().toString(), name: albumName, photos: [] };
      setAlbums(prev => [...prev, newAlbum]);
    }
  };

  // NAYA LOGIC: Photo ko specific Album mein dalne ke liye
  const handleAddToAlbum = (photoId: number, albumId: string) => {
    setAlbums(prev => prev.map(album => {
      if (album.id === albumId && !album.photos.includes(photoId)) {
        return { ...album, photos: [...album.photos, photoId] };
      }
      return album;
    }));
  };

  // --- FILTER DISPLAYED PHOTOS ---
  const displayedPhotos = useMemo(() => {
    if (activeTab === 'Trash') {
      return allPhotos.filter(photo => trash.includes(photo.id));
    }
    const activePhotos = allPhotos.filter(photo => !trash.includes(photo.id));
    if (activeTab === 'Favorites') {
      return activePhotos.filter(photo => favorites.includes(photo.id));
    }
    return activePhotos; 
  }, [allPhotos, activeTab, favorites, trash]);

  return (
    <>
      {/* SPLASH SCREEN */}
      <AnimatePresence>
        {showSplash && (
          <motion.div key="splash" exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] bg-[#050505] flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-24 h-24" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT */}
      <div className="fixed inset-0 w-full h-full bg-[#0a0a0c] text-white flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 relative z-10">
          <Navbar gridSize={gridSize} setGridSize={setGridSize} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {/* GALLERY VIEWS */}
              {['All Photos', 'Favorites', 'Trash'].includes(activeTab) && (
                <Gallery 
                  photos={displayedPhotos} 
                  isLoading={isLoading}
                  gridSize={gridSize} 
                  onImageClick={setSelectedImage} 
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {/* ALBUMS VIEW */}
              {activeTab === 'Albums' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">My Albums</h2>
                    <button onClick={handleCreateAlbum} className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-500 transition">
                      + Create Album
                    </button>
                  </div>
                  {albums.length === 0 ? (
                    <p className="text-gray-500 text-center mt-20">No albums yet.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      {albums.map(album => (
                        <div key={album.id} className="bg-white/5 p-4 rounded-xl cursor-pointer hover:bg-white/10 border border-white/10">
                          <div className="h-32 bg-purple-500/20 rounded-lg mb-3 flex items-center justify-center text-4xl">📁</div>
                          <p className="font-semibold">{album.name}</p>
                          <p className="text-xs text-gray-400">{album.photos.length} photos</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS VIEW */}
              {activeTab === 'Settings' && <FolderManager />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FULLSCREEN IMAGE VIEWER MODAL */}
        <AnimatePresence>
          {selectedImage && (
            <ImageViewer 
              image={selectedImage} 
              isFavorite={favorites.includes(selectedImage.id)}
              isTrashed={trash.includes(selectedImage.id)}
              albums={albums} // YAHAN ALBUMS PASS KIYE
              onClose={() => setSelectedImage(null)} 
              onToggleFavorite={() => handleToggleFavorite(selectedImage.id)}
              onDelete={() => handleMoveToTrash(selectedImage.id)}
              onRestore={() => handleRestoreFromTrash(selectedImage.id)}
              onAddToAlbum={(albumId) => handleAddToAlbum(selectedImage.id, albumId)} // YAHAN ADD TO ALBUM PASS KIYA
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}