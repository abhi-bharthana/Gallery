import { motion } from 'framer-motion';

export default function Gallery() {
  const placeholders = Array.from({ length: 14 }, (_, i) => i + 1);

  // Framer motion variants for stagger effect
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.main 
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10 w-full max-w-5xl mx-auto columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4 pb-10"
    >
      {placeholders.map((item) => (
        <motion.div 
          variants={itemAnim}
          key={item} 
          // will-change-transform GPU ko pehle se bata deta hai ki ye animate hoga (Zero lag)
          className="break-inside-avoid relative rounded-[2rem] overflow-hidden cursor-pointer group will-change-transform"
        >
          <div 
            className={`w-full bg-white/[0.02] border border-white/5 
            ${item % 4 === 0 ? 'h-72' : item % 3 === 0 ? 'h-64' : 'h-48'} 
            flex flex-col items-center justify-center transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:border-purple-500/30`}
          >
            {/* Subtle overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            
            <span className="text-gray-600 font-mono text-xs z-0 transition-opacity duration-300 group-hover:opacity-0">
              img_{item}
            </span>

            {/* Floating pill badge on hover */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs text-white shadow-xl">
                View
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.main>
  );
}