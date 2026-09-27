// src/components/VideoPlayer/index.tsx
import PipPlaceholder from './PipPlaceholder';
import VideoOverlay from './VideoOverlay';
import BottomControls from './BottomControls';
import { useVideoPlayer } from './useVideoPlayer';

interface VideoPlayerProps {
  src: string;
  title?: string; 
  isCover: boolean;
  onToggleCover: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function VideoPlayer(props: VideoPlayerProps) {
  const state = useVideoPlayer(props);

  return (
    <div
      ref={state.containerRef} tabIndex={0}
      className="relative w-full h-full flex items-center justify-center bg-black outline-none select-none overflow-hidden"
      style={{ cursor: state.showControls ? 'default' : 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      <video
        ref={state.videoRef} 
        src={state.streamSrc} // 🔥 Raw file ki jagah ab backend streaming server ka dynamic URL play hoga
        autoPlay
        onTimeUpdate={state.handleTimeUpdate} onProgress={state.handleProgress} onLoadedMetadata={state.handleLoadedMetadata}
        onWaiting={() => state.setIsLoading(true)} onPlaying={() => state.setIsLoading(false)} 
        onCanPlay={() => state.setIsLoading(false)} 
        onEnded={() => state.setIsPlaying(false)}
        className={`w-full h-full transition-[object-fit] duration-500 ${props.isCover ? 'object-cover' : 'object-contain'} ${state.isPiPActive ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* 🔥 Rust backend se extract ki gayi VTT subtitle file yahan load hogi */}
        {state.activeSubUrl && (
          <track 
            src={state.activeSubUrl} 
            kind="subtitles" 
            srcLang="en" 
            label="Selected Subtitle" 
            default 
          />
        )}
      </video>

      <PipPlaceholder isPiPActive={state.isPiPActive} />

      {!state.isPiPActive && (
        <VideoOverlay
          isLoading={state.isLoading} isPlaying={state.isPlaying} togglePlay={state.togglePlay}
          ripple={state.ripple} skipBadge={state.skipBadge} favoriteStar={state.favoriteStar} 
          actionIcon={state.actionIcon} 
          handleVideoAreaClick={state.handleVideoAreaClick}
        />
      )}

      {!state.isPiPActive && (
        <BottomControls
          showControls={state.showControls} isPlaying={state.isPlaying} togglePlay={state.togglePlay} 
          progress={state.progress} buffered={state.buffered} hoverPct={state.hoverPct} 
          duration={state.duration} currentTime={state.currentTime} volume={state.volume} 
          isMuted={state.isMuted} showSpeedMenu={state.showSpeedMenu} playbackRate={state.playbackRate}
          isCover={props.isCover} isFullscreen={state.isFullscreen} hasNext={props.hasNext} hasPrev={props.hasPrev}
          formatTime={state.formatTime} handleScrubStart={state.handleScrubStart} 
          handleTrackHover={state.handleTrackHover} setHoverPct={state.setHoverPct} 
          handleControlSkip={state.handleControlSkip} changeVolume={state.changeVolume}
          setIsMuted={state.setIsMuted} handlePlaybackRateChange={state.handlePlaybackRateChange} 
          setShowSpeedMenu={state.setShowSpeedMenu} togglePiP={state.togglePiP} 
          onToggleCover={props.onToggleCover} toggleFullscreen={state.toggleFullscreen}
          onNext={props.onNext} onPrev={props.onPrev}
          
          // Audio & Subtitles Menu Props
          activeMenu={state.activeMenu} setActiveMenu={state.setActiveMenu}
          audioTracks={state.audioTracks} activeAudio={state.activeAudio} handleAudioChange={state.handleAudioChange}
          subTracks={state.subTracks} activeSub={state.activeSub} handleSubChange={state.handleSubChange}
        />
      )}
    </div>
  );
}