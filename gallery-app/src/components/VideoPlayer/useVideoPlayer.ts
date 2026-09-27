// src/components/VideoPlayer/useVideoPlayer.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { useVideoTracks } from './useVideoTracks'; // 🔥 NAYA HOOK IMPORT KIYA

export function useVideoPlayer({ src, title, hasNext, hasPrev, onNext, onPrev, onToggleFavorite }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);

  const [actionIcon, setActionIcon] = useState<'play' | 'pause' | null>(null);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [skipBadge, setSkipBadge] = useState<{ text: string; key: number } | null>(null);
  const badgeHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedSkipRef = useRef(0);
  const [ripple, setRipple] = useState<{ side: 'left' | 'right'; key: number } | null>(null);
  const [favoriteStar, setFavoriteStar] = useState<{ x: number, y: number, key: number } | null>(null); 
  const favoriteStarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔥 TRACKS KA PURA DIMAAG AB DUSRI FILE MEIN HAI
  const {
    activeMenu, setActiveMenu, audioTracks, activeAudio, handleAudioChange,
    subTracks, activeSub, handleSubChange, activeSubUrl
  } = useVideoTracks(src, videoRef, setIsLoading);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isPiPActive) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setActiveMenu(null);
      }, 3500);
    }
  }, [isPlaying, isPiPActive, setActiveMenu]);

  useEffect(() => {
    resetControlsTimer();
    const node = containerRef.current;
    node?.addEventListener('mousemove', resetControlsTimer);
    node?.addEventListener('mouseleave', () => isPlaying && setShowControls(false));
    return () => {
      node?.removeEventListener('mousemove', resetControlsTimer);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimer, isPlaying]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  };

  const togglePiP = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current.requestPictureInPicture();
    } catch (err) {}
  };

  const showAction = (type: 'play' | 'pause') => {
    setActionIcon(type);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setActionIcon(null), 700);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); showAction('pause'); } 
    else { videoRef.current.play(); showAction('play'); }
    setIsPlaying(!isPlaying);
  };

  const showSkipBadge = (total: number) => {
    setSkipBadge({ text: total > 0 ? `+${total}s` : `${total}s`, key: Date.now() });
    if (badgeHideRef.current) clearTimeout(badgeHideRef.current);
    badgeHideRef.current = setTimeout(() => setSkipBadge(null), 700);
    if (badgeResetRef.current) clearTimeout(badgeResetRef.current);
    badgeResetRef.current = setTimeout(() => { accumulatedSkipRef.current = 0; }, 900);
  };

  const skip = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + amount, 0), duration || Infinity);
    accumulatedSkipRef.current += amount;
    showSkipBadge(accumulatedSkipRef.current);
  };

  const handleControlSkip = (direction: 'forward' | 'rewind', e: React.MouseEvent) => { e.stopPropagation(); skip(direction === 'forward' ? 10 : -10); };

  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); 
    setActiveMenu(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    clickCountRef.current += 1;

    if (clickCountRef.current === 1) {
      clickTimeoutRef.current = setTimeout(() => { if (clickCountRef.current === 1) togglePlay(); clickCountRef.current = 0; }, 250); 
    } else {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickCountRef.current = 0;
      if (relX < 0.3) { skip(-10); setRipple({ side: 'left', key: Date.now() }); } 
      else if (relX > 0.7) { skip(10); setRipple({ side: 'right', key: Date.now() }); } 
      else {
        onToggleFavorite?.();
        setFavoriteStar({ x: e.clientX, y: e.clientY, key: Date.now() });
        if (favoriteStarTimerRef.current) clearTimeout(favoriteStarTimerRef.current);
        favoriteStarTimerRef.current = setTimeout(() => setFavoriteStar(null), 800);
      }
      if (rippleHideRef.current) clearTimeout(rippleHideRef.current);
      rippleHideRef.current = setTimeout(() => setRipple(null), 500);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return;
    const { currentTime: t, duration: d } = videoRef.current;
    setCurrentTime(t); setDuration(d || 0); setProgress(d > 0 ? (t / d) * 100 : 0);
  };

  const handleProgress = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    for (let i = v.buffered.length - 1; i >= 0; i--) {
      if (v.buffered.start(i) <= v.currentTime) {
        setBuffered((v.buffered.end(i) / v.duration) * 100); break;
      }
    }
  };

  const handleLoadedMetadata = () => { if (videoRef.current) setDuration(videoRef.current.duration); };
  const pctFromEvent = (clientX: number, rect: DOMRect) => Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));

  const handleScrubStart = (e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); setIsScrubbing(true); setProgress(pctFromEvent(e.clientX, e.currentTarget.getBoundingClientRect())); };

  useEffect(() => {
    if (!isScrubbing) return;
    const bar = containerRef.current?.querySelector('[data-scrub-track]') as HTMLDivElement | null;
    const onMove = (e: MouseEvent) => { if (!bar) return; setProgress(pctFromEvent(e.clientX, bar.getBoundingClientRect())); };
    const onUp = () => { if (videoRef.current && duration > 0) videoRef.current.currentTime = (progress / 100) * duration; setIsScrubbing(false); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isScrubbing, duration]);

  const handleTrackHover = (e: React.MouseEvent<HTMLDivElement>) => setHoverPct(pctFromEvent(e.clientX, e.currentTarget.getBoundingClientRect()));
  const changeVolume = (val: number) => { setVolume(val); if (videoRef.current) videoRef.current.volume = val; setIsMuted(val === 0); };
  const handlePlaybackRateChange = (rate: number) => { setPlaybackRate(rate); if (videoRef.current) videoRef.current.playbackRate = rate; setActiveMenu(null); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      switch (e.key.toLowerCase()) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'j': e.preventDefault(); skip(-10); break;
        case 'l': e.preventDefault(); skip(10); break;
        case 'arrowright': e.preventDefault(); skip(5); break;
        case 'arrowleft': e.preventDefault(); skip(-5); break;
        case 'arrowup': e.preventDefault(); changeVolume(Math.min(1, volume + 0.05)); break;
        case 'arrowdown': e.preventDefault(); changeVolume(Math.max(0, volume - 0.05)); break;
        case 'm': setIsMuted((m) => !m); break;
        case 'f': toggleFullscreen(); break;
        case 'i': togglePiP(); break; 
        case 'c': handleSubChange(activeSub === -1 && subTracks.length > 0 ? subTracks[0].index : -1); break;
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
          if (videoRef.current && duration > 0) videoRef.current.currentTime = (parseInt(e.key) / 10) * duration; break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [volume, isPlaying, duration, subTracks, activeSub, handleSubChange]);

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs)) return '0:00';
    const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60); const s = Math.floor(secs % 60);
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    return h > 0 ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
  };

  return {
    containerRef, videoRef, isPlaying, isLoading, progress, buffered, currentTime, duration,
    volume, isMuted, showControls, hoverPct, playbackRate, isFullscreen, isPiPActive,
    skipBadge, ripple, favoriteStar, actionIcon, 
    activeMenu, setActiveMenu, audioTracks, activeAudio, handleAudioChange, subTracks, activeSub, handleSubChange, activeSubUrl,
    toggleFullscreen, togglePiP, togglePlay, handleControlSkip, handleVideoAreaClick, handleTimeUpdate, 
    handleProgress, handleLoadedMetadata, handleScrubStart, handleTrackHover, setHoverPct, changeVolume, 
    setIsMuted, handlePlaybackRateChange, formatTime, setIsPlaying, setIsLoading
  };
}