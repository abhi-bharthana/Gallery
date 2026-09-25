import { getCurrentWindow } from '@tauri-apps/api/window';
import { X, Minus, Square } from 'lucide-react';

export default function Titlebar() {
  const appWindow = getCurrentWindow();

  return (
    <div className="h-8 bg-[#050505] flex justify-between items-center fixed top-0 left-0 right-0 z-[100] select-none border-b border-white/[0.02]">
      
      {/* DRAG AREA */}
      <div data-tauri-drag-region className="flex-1 h-full flex items-center px-4 cursor-default">
        <span className="text-[10px] text-gray-600 font-bold tracking-[0.3em] pointer-events-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          AUVEM
        </span>
      </div>

      {/* BUTTONS AREA */}
      <div className="flex h-full relative z-10" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={async () => { await appWindow.minimize(); }} 
          className="h-full w-12 flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <Minus size={14} />
        </button>
        
        <button 
          onClick={async () => { await appWindow.toggleMaximize(); }} 
          className="h-full w-12 flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <Square size={12} />
        </button>
        
        <button 
          onClick={async () => { await appWindow.close(); }} 
          className="h-full w-12 flex items-center justify-center hover:bg-red-500 text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
      
    </div>
  );
}