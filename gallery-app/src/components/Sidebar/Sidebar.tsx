import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, FolderHeart, Star, Trash2, Menu } from 'lucide-react';
import Settings from './Settings';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const menu = [
    { name: "All Photos", icon: <ImageIcon size={20} /> },
    { name: "Albums", icon: <FolderHeart size={20} /> },
    { name: "Favorites", icon: <Star size={20} /> },
    { name: "Trash", icon: <Trash2 size={20} /> },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isExpanded ? 250 : 72 }}
      transition={{ type: "spring", stiffness: 300, damping: 35, mass: 0.8 }}
      className="h-full bg-white/[0.015] py-7 flex flex-col gap-8 hidden md:flex relative z-20 flex-shrink-0"
      style={{ willChange: "width" }}
    >
      
      {/* SOLID HEADER - Menu + Custom Logo + AUVEM Text */}
      <div className="flex items-center h-10 px-5 overflow-hidden whitespace-nowrap">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors duration-200 flex-shrink-0 outline-none"
        >
          <Menu size={22} />
        </button>
        
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-4 flex items-center gap-2.5"
              style={{ willChange: "transform, opacity" }}
            >
              {/* TUMHARA CUSTOM LOGO YAHAN AAYEGA */}
              {/* Make sure logo.png is inside the "public" folder of your project */}
              <img 
                src="/logo.png" 
                alt="Auvem Logo" 
                className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
              />

              {/* AUVEM BRAND NAME WITH SLEEK FONT */}
              <div 
                className="text-lg tracking-[0.25em] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 mt-0.5"
                // 'Outfit' aur 'Montserrat' bohot premium aur wide fonts hain
                style={{ fontFamily: "'Outfit', 'Montserrat', 'Space Grotesk', sans-serif" }}
              >
                AUVEM<span className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]">.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Nav Items */}
      <ul className="flex flex-col gap-2 flex-1 px-3 mt-4">
        {menu.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <li 
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              title={!isExpanded ? item.name : ""}
              className={`relative group flex items-center ${isExpanded ? 'justify-start px-4' : 'justify-center'} py-3.5 cursor-pointer transition-colors duration-200 z-10 rounded-full
                ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-100'}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white/[0.08] rounded-full -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  transition={{ type: "spring", stiffness: 250, damping: 25 }}
                  style={{ willChange: "transform, opacity" }} 
                />
              )}
              
              <div className={`transition-transform duration-200 ${isActive ? 'text-purple-400' : 'group-hover:scale-110'} flex-shrink-0`}>
                {item.icon}
              </div>
              
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, width: "auto", marginLeft: 16 }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-sm tracking-wide overflow-hidden whitespace-nowrap"
                    style={{ willChange: "opacity, width" }} 
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      <div className="px-3">
        <Settings 
          activeTab={activeTab} 
          onClick={() => setActiveTab('Settings')} 
          isExpanded={isExpanded} 
        />
      </div>
      
    </motion.aside>
  );
}