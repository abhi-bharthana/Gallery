// src/components/MediaViewer/VideoCanvas.tsx
import { motion } from 'framer-motion';
import VideoPlayer from '../VideoPlayer';

export default function VideoCanvas({
  image, isCover, setIsCover,
  onClose, handleBackgroundTap, 
  onNext, onPrev, hasNext, hasPrev,
  isFavorite, onToggleFavorite
}: any) {
  return (
    <div 
      className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden touch-none"
      onClick={handleBackgroundTap}
    >
      <motion.div 
        layoutId={`media-${image.id}`} 
        className="w-full h-full pointer-events-auto flex items-center justify-center"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.8}
        onDragEnd={(_e, { offset, velocity }) => {
          if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) onClose();
        }}
      >
        <VideoPlayer 
          src={image.url} 
          title={image.filename}
          isCover={isCover} 
          onToggleCover={() => setIsCover(!isCover)} 
          onNext={onNext} 
          onPrev={onPrev} 
          hasNext={hasNext} 
          hasPrev={hasPrev} 
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite} 
        />
      </motion.div>
    </div>
  );
}