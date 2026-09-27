// src/components/MediaViewer/index.tsx
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';
import InfoPanel from './InfoPanel';
import Navigation from './Navigation';
import ImageCanvas from './ImageCanvas';
import VideoCanvas from './VideoCanvas';
import { useMediaControls } from './useMediaControls';

export default function MediaViewer({ 
  image, isFavorite, isTrashed, albums, 
  onClose, onToggleFavorite, onDelete, onRestore, onAddToAlbum,
  onNext, onPrev, hasNext, hasPrev 
}: any) {
  const isExternal = image?.id?.startsWith('external-view-');
  const isVideo = image?.filename?.match(/\.(mp4|mkv|mov|webm|hevc)$/i) || image?.type === 'video';

  // 🔥 Saara logic custom hook me shift ho gaya!
  const {
    showInfo, setShowInfo,
    scale, setScale,
    isUiVisible, 
    isCover, setIsCover,
    isAutoPlaying, setIsAutoPlaying,
    handleBackgroundTap, handleImageTap,
    isZoomed
  } = useMediaControls({ onClose, onNext, onPrev, hasNext, hasPrev, isVideo, imageId: image.id });

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-3xl"
        onClick={handleBackgroundTap}
      />

      <AnimatePresence>
        {isUiVisible && !isZoomed && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <TopBar 
              image={image} isFavorite={isFavorite} isTrashed={isTrashed} albums={albums}
              showInfo={showInfo} setShowInfo={setShowInfo}
              isCover={isCover} setIsCover={setIsCover}
              isAutoPlaying={isAutoPlaying} setIsAutoPlaying={setIsAutoPlaying}
              onClose={onClose} 
              isExternal={isExternal}
              onToggleFavorite={isExternal ? undefined : () => onToggleFavorite(image.id)} 
              onDelete={isExternal ? undefined : onDelete} 
              onRestore={isExternal ? undefined : onRestore} 
              onAddToAlbum={isExternal ? undefined : onAddToAlbum}
            />
            {!isVideo && <Navigation onNext={onNext} onPrev={onPrev} hasNext={hasNext} hasPrev={hasPrev} />}
          </motion.div>
        )}
      </AnimatePresence>

      <InfoPanel image={image} showInfo={showInfo && !isZoomed && isUiVisible} />

      {isVideo ? (
        <VideoCanvas 
          image={image} scale={scale} setScale={setScale} 
          isCover={isCover} setIsCover={setIsCover}
          onClose={onClose} handleBackgroundTap={handleBackgroundTap}
          onNext={onNext} onPrev={onPrev} hasNext={hasNext} hasPrev={hasPrev}
          isFavorite={isFavorite} onToggleFavorite={() => onToggleFavorite(image.id)}
        />
      ) : (
        <ImageCanvas 
          image={image} scale={scale} setScale={setScale} isCover={isCover}
          onClose={onClose} handleBackgroundTap={handleBackgroundTap} handleImageTap={handleImageTap} 
        />
      )}
    </>
  );
}