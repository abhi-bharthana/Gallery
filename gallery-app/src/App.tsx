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
  
  // Naya state jo Titlebar ko hide karega
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'F11' || e.code === 'F11') {
        e.preventDefault(); 
        try {
          const appWindow = getCurrentWindow();
          const currentFullscreen = await appWindow.isFullscreen();
          
          // True fullscreen trigger karo
          await appWindow.setFullscreen(!currentFullscreen);
          
          // State update karo taaki Titlebar gayab ho jaye
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
    // Jab fullscreen hoga toh pt-8 (padding-top) hat jayega taaki app top se shuru ho
    <div className={`h-screen w-screen bg-[#0a0a0c] text-white flex overflow-hidden relative selection:bg-purple-500/30 transition-all duration-300 ${!isFullscreen ? 'pt-8' : 'pt-0'}`}>
      
      {/* Agar fullscreen NAHI hai, tabhi Titlebar dikhegi */}
      {!isFullscreen && <Titlebar />}

      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* YAHAN UPDATE KIYA HAI: overscroll-none aur scroll-smooth add kar diya */}
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
  );
}