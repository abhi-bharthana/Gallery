import { Search, Grid, LayoutGrid, Maximize } from 'lucide-react';
import { motion } from 'framer-motion';
interface NavbarProps {
  gridSize: 'small' | 'medium' | 'large';
  setGridSize: (size: 'small' | 'medium' | 'large') => void;
}

export default function Navbar({ gridSize, setGridSize }: NavbarProps) {
  return (
    <nav className="relative z-10 w-full max-w-7xl mx-auto flex justify-between items-center mb-8 gap-4 px-2">
      
      {/* Glowing Search Bar */}
      <div className="flex-1 max-w-md flex items-center gap-3 bg-[#121214] border border-white/[0.05] px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 focus-within:bg-[#1a1a1d] focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] group">
        <Search size={18} className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
        <input 
          type="text" 
          placeholder="Search gallery..." 
          className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder:text-gray-600 font-medium tracking-wide"
        />
      </div>

      <div className="flex items-center gap-5">
        {/* Grid Size Controller */}
        <div className="flex items-center bg-[#121214] border border-white/[0.05] p-1 rounded-full shadow-lg">
          {['small', 'medium', 'large'].map((size) => {
            const Icon = size === 'small' ? Grid : size === 'medium' ? LayoutGrid : Maximize;
            return (
              <button 
                key={size}
                onClick={() => setGridSize(size as 'small' | 'medium' | 'large')}
                className={`relative p-2.5 rounded-full transition-colors duration-300 z-10 ${gridSize === size ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {gridSize === size && (
                  <motion.div 
                    layoutId="grid-active"
                    className="absolute inset-0 bg-white/[0.1] rounded-full -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <div className="w-[1px] h-6 bg-white/10"></div>

        <img 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abhi" 
          alt="Profile" 
          className="w-10 h-10 rounded-full bg-purple-500/10 cursor-pointer border-2 border-transparent hover:border-purple-500/50 transition-all duration-300 shadow-lg object-cover"
        />
      </div>
    </nav>
  );
}