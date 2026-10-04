// src/components/VideoPlayer/index.tsx
import { useState, useEffect } from 'react'; // 🔥 Hooks import kiye
import PipPlaceholder from './PipPlaceholder';
import VideoOverlay from './VideoOverlay';
import BottomControls from './BottomControls';
import { useVideoPlayer } from './useVideoPlayer';
import AuvemIntro from './AuvemIntro'; // 🔥 Intro component import kiya

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

  // 🔥 Intro Control States
  const [showIntro, setShowIntro] = useState(false);
  const [introResolved, setIntroResolved] = useState(false);

  // 🔥 SMART LOGIC: Check karo ki video shuru se start ho raha hai ya beech se
  useEffect(() => {
    // Jab backend se proper stream URL aaye, jisme 'start=' ho
    if (!introResolved && state.streamSrc.includes('start=')) {
      const match = state.streamSrc.match(/start=([\d.]+)/);
      const startTime = match ? parseFloat(match[1]) : 0;
      
      // Agar video 2 seconds se pehle shuru ho raha hai, toh hi intro dikhao
      if (startTime <= 2.0) {
        setShowIntro(true);
      }
      setIntroResolved(true); // Faisla ho gaya, ab bar-bar check nahi karega
    }
  }, [state.streamSrc, introResolved]);

  // 🔥 Keep video paused while Intro is playing
  useEffect(() => {
    if (showIntro && state.videoRef.current) {
      state.videoRef.current.pause();
      state.setIsPlaying(false);
    }
  }, [showIntro, state.streamSrc]);

  return (
    <div
      ref={state.containerRef} tabIndex={0}
      className="relative w-full h-full flex items-center justify-center bg-black outline-none select-none overflow-hidden"
      style={{ cursor: state.showControls ? 'default' : 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 🎬 AUVEM PREMIUM INTRO OVERLAY */}
      {showIntro && (
        <AuvemIntro 
          onComplete={() => {
            setShowIntro(false);
            if (state.videoRef.current) {
              state.videoRef.current.play(); // Intro khatam hote hi video resume
              state.setIsPlaying(true);
            }
          }} 
        />
      )}

      <video
        ref={state.videoRef} 
        src={state.streamSrc}
        autoPlay
        onTimeUpdate={state.handleTimeUpdate} onProgress={state.handleProgress} onLoadedMetadata={state.handleLoadedMetadata}
        onWaiting={() => state.setIsLoading(true)} onPlaying={() => state.setIsLoading(false)} 
        onCanPlay={() => state.setIsLoading(false)} 
        onEnded={() => state.setIsPlaying(false)}
        // 🔥 Jab intro chal raha ho, tab video ko poori tarah hide rakho (opacity-0)
        className={`w-full h-full transition-[object-fit] duration-500 ${props.isCover ? 'object-cover' : 'object-contain'} ${(state.isPiPActive || showIntro) ? 'opacity-0' : 'opacity-100'}`}
      >
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
          duration={state.mediaDuration || state.duration} 
          currentTime={state.currentTime} volume={state.volume} 
          isMuted={state.isMuted} showSpeedMenu={state.showSpeedMenu} playbackRate={state.playbackRate}
          isCover={props.isCover} isFullscreen={state.isFullscreen} hasNext={props.hasNext} hasPrev={props.hasPrev}
          formatTime={state.formatTime} handleScrubStart={state.handleScrubStart} 
          handleTrackHover={state.handleTrackHover} setHoverPct={state.setHoverPct} 
          handleControlSkip={state.handleControlSkip} changeVolume={state.changeVolume}
          setIsMuted={state.setIsMuted} handlePlaybackRateChange={state.handlePlaybackRateChange} 
          setShowSpeedMenu={state.setShowSpeedMenu} togglePiP={state.togglePiP} 
          onToggleCover={props.onToggleCover} toggleFullscreen={state.toggleFullscreen}
          onNext={props.onNext} onPrev={props.onPrev}
          activeMenu={state.activeMenu} setActiveMenu={state.setActiveMenu}
          audioTracks={state.audioTracks} activeAudio={state.activeAudio} handleAudioChange={state.handleAudioChange}
          subTracks={state.subTracks} activeSub={state.activeSub} handleSubChange={state.handleSubChange}
        />
      )}
    </div>
  );
}