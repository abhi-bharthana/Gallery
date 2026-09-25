import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[99999] bg-[#050505] flex items-center justify-center"
    >
      <img src="/logo.png" alt="Logo" className="w-20 h-20 animate-pulse" />
    </motion.div>
  );
}