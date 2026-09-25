// components/Navbar.tsx
import { Search, Grid, LayoutGrid, Maximize, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  gridSize: 'small' | 'medium' | 'large';
  setGridSize: (size: 'small' | 'medium' | 'large') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({ gridSize, setGridSize, searchQuery, setSearchQuery }: NavbarProps) {
  return (
    <nav className="relative z-10 w-full max-w-7xl mx-auto flex justify-between items-center mb-8 gap-4 px-2">
      <div className="flex-1 max-w-md flex items-center gap-3 bg-[#121214] border border-white/[0.05] px-4 py-2 rounded-full shadow-lg transition-all duration-300 focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] group">
        <Search size={18} className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by filename..."
          className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder:text-gray-600 font-medium tracking-wide"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center bg-[#121214] border border-white/[0.05] p-1 rounded-full shadow-lg">
          {(['small', 'medium', 'large'] as const).map((size) => {
            const Icon = size === 'small' ? Grid : size === 'medium' ? LayoutGrid : Maximize;
            return (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`relative p-2.5 rounded-full transition-colors duration-300 z-10 ${
                  gridSize === size ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {gridSize === size && (
                  <motion.div
                    layoutId="grid-active"
                    className="absolute inset-0 bg-white/[0.1] rounded-full -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}