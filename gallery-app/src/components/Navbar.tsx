import { Search, LayoutGrid } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="relative z-10 w-full max-w-5xl mx-auto flex justify-between items-center mb-8 gap-4">
      {/* Pill-shaped Search Bar */}
      <div className="flex-1 max-w-md flex items-center gap-3 bg-white/[0.03] border border-white/5 backdrop-blur-xl px-5 py-3 rounded-full shadow-lg transition-all duration-300 focus-within:bg-white/[0.08] focus-within:border-purple-500/30">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Search gallery..." 
          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-500"
        />
      </div>

      {/* Pill-shaped Action Buttons */}
      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 backdrop-blur-xl px-2 py-2 rounded-full shadow-lg">
        <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
          <LayoutGrid size={18} />
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
        <img 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abhi" 
          alt="Profile" 
          className="w-8 h-8 rounded-full bg-purple-500/20 cursor-pointer border border-white/10 hover:border-purple-500 transition-colors"
        />
      </div>
    </nav>
  );
}