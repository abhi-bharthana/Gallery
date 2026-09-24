import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, FolderHeart, Star, Trash2, Settings as SettingsIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  // Sidebar ki open/close state
  const [isExpanded, setIsExpanded] = useState(true);

  const menu = [
    { name: "All Photos", icon: <ImageIcon size={20} /> },
    { name: "Albums", icon: <FolderHeart size={20} /> },
    { name: "Favorites", icon: <Star size={20} /> },
    { name: "Trash", icon: <Trash2 size={20} /> },
  ];

  return (
    <motion.aside 
      // 288px jab open ho, 88px jab close ho
      initial={{ width: 288 }}
      animate={{ width: isExpanded ? 288 : 88 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-white/[0.015] border-r border-white-[0.05] backdrop-blur-2xl py-6 flex flex-col gap-8 hidden md:flex relative z-20 flex-shrink-0"
    >
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3.5 top-8 bg-[#121214] border border-white/10 rounded-full p-1.5 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-50 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
      
      {/* Ultra-Premium Glowing Logo */}
      <div className="flex items-center justify-center h-8 px-4 overflow-hidden whitespace-nowrap">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div 
              key="full-logo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl tracking-[0.2em] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              GALLERY<span className="text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,1)]">.</span>
            </motion.div>
          ) : (
            <motion.div 
              key="short-logo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              G<span className="text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,1)]">.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Nav Items */}
      <ul className="flex flex-col gap-2 flex-1 px-3">
        {menu.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <li 
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              title={!isExpanded ? item.name : ""}
              className={`relative group flex items-center ${isExpanded ? 'justify-start px-4' : 'justify-center'} py-3 cursor-pointer transition-colors duration-300 z-10 rounded-xl
                ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {/* Sliding Pill Background */}
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white/[0.08] rounded-xl -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.05]"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              
              {/* Icon with Neon Glow on Active */}
              <div className={`transition-all duration-300 ${isActive ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]' : 'group-hover:text-purple-300'} flex-shrink-0`}>
                {item.icon}
              </div>
              
              {/* Fluid Text Reveal */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, width: "auto", marginLeft: 16 }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    className="font-medium text-sm tracking-wide overflow-hidden whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {/* Settings Section */}
      <div className="px-3">
        <div 
          title={!isExpanded ? "Settings" : ""}
          className={`flex items-center ${isExpanded ? 'justify-start px-4' : 'justify-center'} py-3 rounded-xl cursor-pointer text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 group`}
        >
          <SettingsIcon size={20} className="group-hover:rotate-90 transition-transform duration-500 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span 
                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                animate={{ opacity: 1, width: "auto", marginLeft: 16 }}
                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                className="font-medium text-sm tracking-wide overflow-hidden whitespace-nowrap"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      
    </motion.aside>
  );
}