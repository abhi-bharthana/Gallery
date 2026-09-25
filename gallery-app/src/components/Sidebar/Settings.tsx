import { Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsProps {
  activeTab?: string;
  onClick?: () => void;
  isExpanded?: boolean;
}

export default function Settings({ activeTab, onClick, isExpanded = true }: SettingsProps) {
  const isActive = activeTab === 'Settings';

  return (
    <div 
      title={!isExpanded ? "Settings" : ""}
      onClick={onClick}
      // rounded-full for perfect pill shape. Fast color transitions instead of 'all'
      className={`relative flex items-center ${isExpanded ? 'justify-start px-5' : 'justify-center'} py-3.5 rounded-full cursor-pointer transition-colors duration-200 group z-10
      ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'}`}
    >
      {isActive && (
        <motion.div 
          layoutId="active-pill"
          className="absolute inset-0 bg-white/[0.08] rounded-full -z-10 border border-white/[0.05]"
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          // YAHAN HAI JADOO: GPU Acceleration
          style={{ willChange: "transform, opacity" }} 
        />
      )}
      
      <SettingsIcon 
        size={20} 
        // Sirf transform pe transition laga hai lag free spin ke liye
        className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-purple-400' : 'group-hover:rotate-90'}`} 
      />
      
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span 
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: "auto", marginLeft: 16 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.2 }} // Fast linear animation for weak systems
            className="font-medium text-sm tracking-wide overflow-hidden whitespace-nowrap"
            style={{ willChange: "opacity, width" }} // GPU Hint
          >
            Settings
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}