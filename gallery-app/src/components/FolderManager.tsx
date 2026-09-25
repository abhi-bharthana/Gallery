import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, FolderKanban, Trash2 } from 'lucide-react';

export default function FolderManager() {
  const [folders, setFolders] = useState<string[]>([]);

  // Load saved folders on mount
  useEffect(() => {
    const saved = localStorage.getItem('synced_folders');
    if (saved) setFolders(JSON.parse(saved));
  }, []);

  const handleAddFolder = async () => {
    // OS ka native premium folder picker khulega
    const selectedPath = await open({
      directory: true,
      multiple: true,
      title: 'Select Folders to Sync',
    });

    if (selectedPath) {
      const newPaths = Array.isArray(selectedPath) ? selectedPath : [selectedPath];
      const updatedFolders = [...new Set([...folders, ...newPaths])]; // Remove duplicates
      
      setFolders(updatedFolders);
      localStorage.setItem('synced_folders', JSON.stringify(updatedFolders));
    }
  };

  const handleRemoveFolder = (folderToRemove: string) => {
    const updated = folders.filter(f => f !== folderToRemove);
    setFolders(updated);
    localStorage.setItem('synced_folders', JSON.stringify(updated));
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-[#121214] border border-white/[0.05] rounded-3xl shadow-2xl relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Sync Locations
          </h2>
          <p className="text-gray-400 text-sm mt-1">Choose which drives or folders appear in your gallery.</p>
        </div>
        
        <button 
          onClick={handleAddFolder}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full backdrop-blur-md transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-white/10"
        >
          <FolderPlus size={18} />
          <span className="font-semibold text-sm">Add Folder</span>
        </button>
      </div>

      <ul className="space-y-3 relative z-10">
        <AnimatePresence>
          {folders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]"
            >
              <FolderKanban size={40} className="text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">No folders synced yet.</p>
              <p className="text-gray-600 text-sm">Add a folder to start scanning images.</p>
            </motion.div>
          ) : (
            folders.map((folder) => (
              <motion.li 
                key={folder}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] p-4 rounded-xl hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-4 overflow-hidden text-ellipsis whitespace-nowrap">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <FolderKanban size={18} />
                  </div>
                  <span className="text-gray-300 font-mono text-sm truncate max-w-md">{folder}</span>
                </div>
                <button 
                  onClick={() => handleRemoveFolder(folder)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </motion.li>
            ))
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
}