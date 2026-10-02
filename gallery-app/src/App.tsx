// src/App.tsx
import { useState, useMemo, useEffect } from 'react'; 
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core'; // 🔥 API call ke liye
import './App.css';

import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar';
import Gallery from './components/Gallery/index';
import MediaViewer from './components/MediaViewer/index';
import FolderManager from './components/FolderManager';
import AlbumsView from './components/AlbumsView';
import SplashScreen from './components/SplashScreen';
import VaultUnlock from './components/Vault/VaultUnlock'; // 🔥 Ghost mode unlock UI

import { useGalleryData, LocalImage } from './hooks/useGalleryData';
import { useSystemHooks } from './hooks/useSystemHooks'; 

export default function App() {
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [activeTab, setActiveTab] = useState('All Photos');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<LocalImage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('time_desc'); 
  const [showSplash, setShowSplash] = useState(true);

  // 🔥 GHOST MODE STATES
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [showVaultAuth, setShowVaultAuth] = useState(false);

  // 🔥 Global Shortcut for Ghost Mode (Ctrl + Shift + H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (isGhostMode) {
          setIsGhostMode(false); // Relock instantly
        } else {
          setShowVaultAuth(true); // Open Authentication Modal
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGhostMode]);

  // 🔥 DB-delegated search & sorting hook (Ghost Mode injected!)
  const gallery = useGalleryData(searchQuery, sortBy, isGhostMode);
  useSystemHooks(setSelectedImage, setShowSplash);

  // 🔥 1-Click Vault Lock Engine (Hide)
  const handleLockToVault = async (ids: string[]) => {
    try {
      for (const id of ids) {
        const img = gallery.allPhotos.find((p) => p.id === id);
        if (img) {
           await invoke('encrypt_and_lock_file', { filePath: img.rawPath });
        }
      }
      gallery.syncImages(); // Refresh UI to hide files
      if (selectedImage) setSelectedImage(null); // Close viewer if a viewed item was locked
    } catch (err) {
      console.error('Vault lock error:', err);
    }
  };

  // 🔥 1-Click Vault Unlock Engine (Unhide)
  const handleUnlockFromVault = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await invoke('decrypt_and_unlock_file', { id });
      }
      gallery.syncImages(); // Refresh UI to show files normally
      if (selectedImage) setSelectedImage(null); // Close viewer
    } catch (err) {
      console.error('Vault unlock error:', err);
    }
  };

  useEffect(() => {
    gallery.syncImages();
  }, []); 

  const displayedPhotos = useMemo(() => {
    let base = [...gallery.allPhotos]; 
    
    if (activeTab === 'Trash') return base.filter(p => gallery.trash.includes(p.id));
    
    base = base.filter(p => !gallery.trash.includes(p.id));
    
    if (activeTab === 'Favorites') base = base.filter(p => gallery.favorites.includes(p.id));
    
    if (activeTab === 'Albums' && selectedAlbumId) {
      const album = gallery.albums.find(a => a.id === selectedAlbumId);
      base = album ? base.filter(p => album.photos.includes(p.id)) : [];
    }

    return base;
  }, [gallery.allPhotos, gallery.trash, gallery.favorites, gallery.albums, activeTab, selectedAlbumId]);

  const handleViewerClose = async () => {
    if (selectedImage?.id.startsWith('external-view-')) await getCurrentWindow().close();
    else setSelectedImage(null);
    
    gallery.fetchHistory();
  };

  return (
    <>
      <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>

      <div className="fixed inset-0 w-full h-full bg-[#0a0a0c] text-white flex overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab); 
            setSelectedAlbumId(null);
          }} 
        />

        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 relative z-10">
          <Navbar 
            gridSize={gridSize} setGridSize={setGridSize} 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            sortBy={sortBy} setSortBy={setSortBy} 
          />

          <AnimatePresence mode="wait">
            <motion.div key={activeTab + (selectedAlbumId || '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="w-full h-full pb-12">
              
              {['All Photos', 'Favorites', 'Trash'].includes(activeTab) && (
                <Gallery 
                  photos={displayedPhotos} 
                  videoHistory={gallery.videoHistory}
                  isLoading={gallery.isLoading} gridSize={gridSize} onImageClick={setSelectedImage} 
                  favorites={gallery.favorites} onToggleFavorite={gallery.toggleFavorite} 
                  onDelete={gallery.moveToTrash} isTrashView={activeTab === 'Trash'} onRestore={gallery.restoreFromTrash} 
                  onLockToVault={handleLockToVault} 
                  onUnlockFromVault={handleUnlockFromVault} // 🔥 Added
                  isGhostMode={isGhostMode} // 🔥 Added
                />
              )}

              {activeTab === 'Albums' && (
                <div className="max-w-7xl mx-auto">
                  {selectedAlbumId ? (
                    <div>
                      <button onClick={() => setSelectedAlbumId(null)} className="mb-8 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-sm font-semibold text-gray-300 hover:text-white transition-all shadow-lg flex items-center gap-2 group w-fit backdrop-blur-md">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Albums
                      </button>
                      <Gallery 
                        photos={displayedPhotos} 
                        videoHistory={gallery.videoHistory}
                        isLoading={gallery.isLoading} gridSize={gridSize} onImageClick={setSelectedImage} 
                        favorites={gallery.favorites} onToggleFavorite={gallery.toggleFavorite} 
                        onDelete={gallery.moveToTrash} isTrashView={false} onRestore={gallery.restoreFromTrash} 
                        onLockToVault={handleLockToVault} 
                        onUnlockFromVault={handleUnlockFromVault} // 🔥 Added
                        isGhostMode={isGhostMode} // 🔥 Added
                      />
                    </div>
                  ) : (
                    <AlbumsView albums={gallery.albums} allPhotos={gallery.allPhotos} onCreateAlbum={gallery.createAlbum} onSelectAlbum={setSelectedAlbumId} />
                  )}
                </div>
              )}

              {/* @ts-ignore */}
              {activeTab === 'Settings' && <FolderManager onFoldersChanged={gallery.syncImages} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedImage && (() => {
            const idx = displayedPhotos.findIndex(p => p.id === selectedImage.id);
            const hasNext = idx >= 0 && idx < displayedPhotos.length - 1;
            const hasPrev = idx > 0;

            return (
              <MediaViewer
                image={selectedImage} 
                isFavorite={gallery.favorites.includes(selectedImage.id)} 
                isTrashed={gallery.trash.includes(selectedImage.id)} 
                albums={gallery.manualAlbums} 
                onClose={handleViewerClose}
                onToggleFavorite={() => gallery.toggleFavorite(selectedImage.id)}
                onDelete={() => {
                  gallery.moveToTrash(selectedImage.id);
                  if (hasNext) setSelectedImage(displayedPhotos[idx + 1]);
                  else if (hasPrev) setSelectedImage(displayedPhotos[idx - 1]);
                  else setSelectedImage(null);
                }}
                onRestore={() => { gallery.restoreFromTrash(selectedImage.id); setSelectedImage(null); }}
                onAddToAlbum={(albumId: string) => gallery.addToAlbum(selectedImage.id, albumId)}
                onNext={() => hasNext && setSelectedImage(displayedPhotos[idx + 1])}
                onPrev={() => hasPrev && setSelectedImage(displayedPhotos[idx - 1])}
                hasNext={hasNext} hasPrev={hasPrev}
                onLockToVault={(ids: string[]) => handleLockToVault(ids)} 
                onUnlockFromVault={(ids: string[]) => handleUnlockFromVault(ids)} // 🔥 Added
                isGhostMode={isGhostMode} // 🔥 Added
              />
            );
          })()}
        </AnimatePresence>
      </div>

      {/* 🔥 The Ghost Mode Authentication Modal */}
      <AnimatePresence>
        {showVaultAuth && (
          <VaultUnlock 
            onUnlocked={() => {
              setIsGhostMode(true);
              setShowVaultAuth(false);
            }} 
            onClose={() => setShowVaultAuth(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}