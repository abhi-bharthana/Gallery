import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar';
import Gallery from './components/Gallery';
import ImageViewer from './components/ImageViewer';
import FolderManager from './components/FolderManager'; // <-- Import lag gaya

export default function App() {
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [activeTab, setActiveTab] = useState('All Photos');
  
  // State ab root level par hai
  const [selectedImage, setSelectedImage] = useState<{id: number, url: string} | null>(null);

  return (
    // overflow-hidden yahan ensure karega ki root level pe koi scroll na ho
    <div className="h-screen w-screen bg-[#0a0a0c] text-white flex overflow-hidden relative selection:bg-purple-500/30">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 relative">
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
            {/* Main Gallery */}
            {activeTab === 'All Photos' && (
              <Gallery gridSize={gridSize} onImageClick={setSelectedImage} />
            )}
            
            {/* Folder Sync UI */}
            {activeTab === 'Settings' && (
              <FolderManager />
            )}
            
            {/* Baki placeholders (Albums, Favorites, Trash) */}
            {activeTab !== 'All Photos' && activeTab !== 'Settings' && (
              <div className="flex items-center justify-center h-64 text-gray-400 font-mono">
                {activeTab} Content Here...
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* MODAL SABSE UPAR HAI - Stacking context bypass ho gaya */}
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