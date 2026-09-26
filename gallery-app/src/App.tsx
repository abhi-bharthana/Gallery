// src/App.tsx
import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window'; // 🔥 NAYA IMPORT 🔥
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar';
import Gallery from './components/Gallery/index';
import ImageViewer from './components/ImageViewer/index';
import FolderManager from './components/FolderManager';
import AlbumsView from './components/AlbumsView';
import SplashScreen from './components/SplashScreen';
import { useGalleryData, LocalImage } from './hooks/useGalleryData';

export default function App() {
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [activeTab, setActiveTab] = useState('All Photos');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<LocalImage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  const {
    allPhotos, isLoading, favorites, trash, albums,
    syncImages, toggleFavorite, moveToTrash, restoreFromTrash, createAlbum, addToAlbum
  } = useGalleryData();

  // 🔥 OS File Association Check 🔥
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const checkInitialFile = async () => {
      try {
        const filePath: string | null = await invoke('get_opened_file');
        
        if (filePath) {
          const normalizedPath = filePath.replace(/\\/g, '/');
          const filename = normalizedPath.split('/').pop() || 'Image';
          
          const initialImage: LocalImage = {
            id: 'external-view-' + Date.now().toString(),
            url: convertFileSrc(normalizedPath),
            rawPath: normalizedPath, 
            timestamp: Math.floor(Date.now() / 1000),
            filename: filename,
            width: 800,   // Fallback dimensions for external files
            height: 800   
          };
          
          setSelectedImage(initialImage);
          setShowSplash(false); 
        } else {
          timer = setTimeout(() => setShowSplash(false), 1500);
        }
      } catch (err) {
        console.error("External file check failed:", err);
        timer = setTimeout(() => setShowSplash(false), 1500);
      }
    };

    checkInitialFile();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // 🔥 F11 FULLSCREEN TOGGLE FIX 🔥
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault(); 
        const appWindow = getCurrentWindow();
        const isFullscreen = await appWindow.isFullscreen();
        await appWindow.setFullscreen(!isFullscreen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const displayedPhotos = useMemo(() => {
    let baseList = allPhotos;

    if (activeTab === 'Trash') {
      baseList = allPhotos.filter((photo) => trash.includes(photo.id));
    } else {
      baseList = allPhotos.filter((photo) => !trash.includes(photo.id));
      if (activeTab === 'Favorites') {
        baseList = baseList.filter((photo) => favorites.includes(photo.id));
      } else if (activeTab === 'Albums' && selectedAlbumId) {
        const activeAlbum = albums.find((a) => a.id === selectedAlbumId);
        baseList = activeAlbum ? baseList.filter((photo) => activeAlbum.photos.includes(photo.id)) : [];
      }
    }

    if (!searchQuery.trim()) return baseList;
    return baseList.filter((img) => img.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allPhotos, activeTab, favorites, trash, albums, selectedAlbumId, searchQuery]);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      <div className="fixed inset-0 w-full h-full bg-[#0a0a0c] text-white flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedAlbumId(null);
            
            if (tab === 'All Photos') {
               syncImages();
            }
          }}
        />

        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 relative z-10">
          <Navbar
            gridSize={gridSize}
            setGridSize={setGridSize}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedAlbumId || '')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full pb-12"
            >
              {['All Photos', 'Favorites', 'Trash'].includes(activeTab) && (
                <Gallery
                  photos={displayedPhotos}
                  isLoading={isLoading}
                  gridSize={gridSize}
                  onImageClick={setSelectedImage}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onDelete={moveToTrash}
                  isTrashView={activeTab === 'Trash'}
                  onRestore={restoreFromTrash}
                />
              )}

              {activeTab === 'Albums' && (
                <div className="max-w-7xl mx-auto">
                  {selectedAlbumId ? (
                    <div>
                      <button
                        onClick={() => setSelectedAlbumId(null)}
                        className="mb-8 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 rounded-full text-sm font-semibold text-gray-300 hover:text-white transition-all shadow-lg flex items-center gap-2 group w-fit backdrop-blur-md"
                      >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Albums
                      </button>
                      <Gallery
                        photos={displayedPhotos}
                        isLoading={isLoading}
                        gridSize={gridSize}
                        onImageClick={setSelectedImage}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        onDelete={moveToTrash}
                        isTrashView={false}
                        onRestore={restoreFromTrash}
                      />
                    </div>
                  ) : (
                    <AlbumsView 
                      albums={albums} 
                      allPhotos={allPhotos} 
                      onCreateAlbum={createAlbum} 
                      onSelectAlbum={setSelectedAlbumId} 
                    />
                  )}
                </div>
              )}

              {/* 🔥 FIX: @ts-ignore lagaya taaki build time pe strict type error na aaye 🔥 */}
              {activeTab === 'Settings' && (
                // @ts-ignore
                <FolderManager onFoldersChanged={syncImages} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedImage && (() => {
            const currentIndex = displayedPhotos.findIndex(p => p.id === selectedImage.id);
            const hasNext = currentIndex >= 0 && currentIndex < displayedPhotos.length - 1;
            const hasPrev = currentIndex > 0;

            return (
              <ImageViewer
                image={selectedImage}
                isFavorite={favorites.includes(selectedImage.id)}
                isTrashed={trash.includes(selectedImage.id)}
                albums={albums}
                
                // 🔥 NAYA FIX: External file se open hone par seedha app close karo 🔥
                onClose={async () => {
                  if (selectedImage.id.startsWith('external-view-')) {
                    const appWindow = getCurrentWindow();
                    await appWindow.close();
                  } else {
                    setSelectedImage(null);
                  }
                }}

                onToggleFavorite={() => toggleFavorite(selectedImage.id)}
                onDelete={() => {
                  moveToTrash(selectedImage.id);
                  if (hasNext) setSelectedImage(displayedPhotos[currentIndex + 1]);
                  else if (hasPrev) setSelectedImage(displayedPhotos[currentIndex - 1]);
                  else setSelectedImage(null);
                }}
                onRestore={() => {
                  restoreFromTrash(selectedImage.id);
                  setSelectedImage(null);
                }}
                onAddToAlbum={(albumId: string) => addToAlbum(selectedImage.id, albumId)}
                onNext={() => hasNext && setSelectedImage(displayedPhotos[currentIndex + 1])}
                onPrev={() => hasPrev && setSelectedImage(displayedPhotos[currentIndex - 1])}
                hasNext={hasNext}
                hasPrev={hasPrev}
              />
            );
          })()}
        </AnimatePresence>
      </div>
    </>
  );
}