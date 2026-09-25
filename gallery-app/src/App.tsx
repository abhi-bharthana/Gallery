import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar';
import Gallery from './components/Gallery';
import ImageViewer from './components/ImageViewer';
import FolderManager from './components/FolderManager';
import Titlebar from './components/Titlebar';

export default function App() {
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [activeTab, setActiveTab] = useState('All Photos');
  const [selectedImage, setSelectedImage] = useState<{id: number, url: string} | null>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // State jo Splash Screen ko control karega
  const [showSplash, setShowSplash] = useState(true);

  // Splash Screen Timer (2.5 seconds tak dikhega)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // F11 Fullscreen Listener (Updated with Focus to remove black bar)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'F11' || e.code === 'F11') {
        e.preventDefault(); 
        try {
          const appWindow = getCurrentWindow();
          const currentFullscreen = await appWindow.isFullscreen();
          
          await appWindow.setFullscreen(!currentFullscreen);
          await appWindow.setFocus(); // Ye Windows ko refresh force karega
          setIsFullscreen(!currentFullscreen);
        } catch (error) {
          console.error("F11 Error:", error);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* --- CINEMATIC SPLASH SCREEN --- */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <img 
                src="/logo.png" 
                alt="AUVEM Logo" 
                className="w-24 h-24 object-contain drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]" 
              />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10, letterSpacing: '0em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.4em' }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              className="text-white text-xl font-bold mt-6 ml-3 text-gray-300"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              AUVEM
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN APP INTERFACE --- */}
      {/* YAHAN UPDATE KIYA HAI: fixed inset-0 w-full h-full laga diya hai aur relative hata diya hai */}
      <div className={`fixed inset-0 w-full h-full bg-[#0a0a0c] text-white flex overflow-hidden selection:bg-purple-500/30 transition-all duration-300 ${!isFullscreen ? 'pt-8' : 'pt-0'}`}>
        
        {!isFullscreen && <Titlebar />}

        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>

        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col h-full overflow-y-auto overscroll-none scroll-smooth p-6 relative">
          <Navbar gridSize={gridSize} setGridSize={setGridSize} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 15, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -15, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full h-full"
            >
              {activeTab === 'All Photos' && (
                <Gallery gridSize={gridSize} onImageClick={setSelectedImage} />
              )}
              
              {activeTab === 'Settings' && (
                <FolderManager />
              )}
              
              {activeTab !== 'All Photos' && activeTab !== 'Settings' && (
                <div className="flex items-center justify-center h-64 text-gray-400 font-mono">
                  {activeTab} Content Here...
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedImage && (
            <ImageViewer 
              image={selectedImage} 
              onClose={() => setSelectedImage(null)} 
            />
          )}
        </AnimatePresence>

      </div>
    </>
  );
}