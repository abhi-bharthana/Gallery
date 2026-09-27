// src/components/VideoPlayer/useVideoTracks.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useVideoTracks(src: string, videoRef: React.RefObject<HTMLVideoElement>, setIsLoading: (val: boolean) => void) {
  const [activeMenu, setActiveMenu] = useState<'speed' | 'audio' | 'sub' | null>(null);
  
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [activeAudio, setActiveAudio] = useState<number>(0);
  
  const [subTracks, setSubTracks] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<number>(-1);
  const [activeSubUrl, setActiveSubUrl] = useState<string | null>(null);

  const [streamSrc, setStreamSrc] = useState<string>(src);
  const [mediaDuration, setMediaDuration] = useState<number>(0);

  // 🔥 VIRTUAL TIMELINE TRACKER: Asli absolute position yahan yaad rakhi jayegi!
  const streamOffsetRef = useRef<number>(0);

  const handleSubChange = useCallback(async (trackIndex: number) => {
    console.log("💬 Switching/Extracting subtitle stream index:", trackIndex);
    setActiveMenu(null);
    setActiveSub(trackIndex);
    
    if (trackIndex === -1) {
      setActiveSubUrl(null);
      return;
    }

    try {
      setIsLoading(true); 
      const vttText: string = await invoke('extract_subtitle_vtt', { 
        videoPath: src, 
        streamIndex: trackIndex 
      });
      
      const blob = new Blob([vttText], { type: 'text/vtt' });
      const blobUrl = URL.createObjectURL(blob);
      
      setActiveSubUrl(blobUrl);
      setIsLoading(false);
    } catch (err) {
      console.error("❌ Failed to extract subtitle via ffmpeg:", err);
      setIsLoading(false);
    }
  }, [src, setIsLoading]);

  useEffect(() => {
    async function initStreamingAndTracks() {
      if (!src) return;
      try {
        console.log("🚀 [FRONTEND] Invoking get_video_tracks with src:", src);
        const metadata: any = await invoke('get_video_tracks', { videoPath: src });
        
        if (metadata.duration) {
          setMediaDuration(metadata.duration);
        }

        const tracks = metadata.tracks || [];
        
        const audio = tracks
          .filter((t: any) => t.codec_type === 'audio')
          .map((t: any, idx: number) => ({
            ...t,
            displayName: t.title && t.title.length > 0 ? t.title : `Audio ${idx + 1} (${t.language.toUpperCase()})`
          }));

        const subs = tracks
          .filter((t: any) => t.codec_type === 'subtitle')
          .map((t: any, idx: number) => ({
            ...t,
            displayName: t.title && t.title.length > 0 ? t.title : `Subtitle ${idx + 1} (${t.language.toUpperCase()})`
          }));
        
        let targetAudioIdx = audio.length > 0 ? audio[0].index : 0;
        let startProgress = 0;
        let targetSubIdx = -1;

        try {
          const history: any = await invoke('get_video_history', { videoPath: src });
          if (history) {
            console.log(`🕰️ [HISTORY FOUND] Resuming from ${history.progress}s | Audio: ${history.audio_lang} | Sub: ${history.sub_lang}`);
            startProgress = history.progress;

            if (history.audio_lang && history.audio_lang !== "unknown") {
              const matchedAudio = audio.find((a: any) => a.language === history.audio_lang);
              if (matchedAudio) targetAudioIdx = matchedAudio.index;
            }

            if (history.sub_lang && history.sub_lang !== "none") {
              const matchedSub = subs.find((s: any) => s.language === history.sub_lang);
              if (matchedSub) targetSubIdx = matchedSub.index;
            }
          }
        } catch (err) {
          console.warn("No history found, starting fresh.");
        }

        if (audio.length > 0) {
          setAudioTracks(audio);
          setActiveAudio(targetAudioIdx);
        } else {
          setAudioTracks([{ index: 0, displayName: 'Default Audio (Stream 1)' }]);
          setActiveAudio(0);
        }

        if (subs.length > 0) {
          setSubTracks(subs);
        } else {
          setSubTracks([]); 
        }

        if (targetSubIdx !== -1) {
          handleSubChange(targetSubIdx);
        } else {
          setActiveSub(-1);
          setActiveSubUrl(null);
        }

        setIsLoading(true);
        const serverUrl: string = await invoke('set_active_media_stream', { 
          videoPath: src, 
          audioIndex: targetAudioIdx 
        });
        
        // 🔥 Offset set kardo aur URL banao
        streamOffsetRef.current = startProgress;
        const safeStart = Number(startProgress).toFixed(3);
        const activeStreamUrl = `${serverUrl}?start=${safeStart}&t=${Date.now()}`;
        
        setStreamSrc(activeStreamUrl);
        setIsLoading(false);

        if (videoRef.current) {
          videoRef.current.src = activeStreamUrl;
          videoRef.current.load();
          videoRef.current.play().catch((err) => {
            if (err.name !== 'AbortError') {
              console.error("Initial video play error:", err);
            }
          });
        }

      } catch (err) {
        console.error("❌ [FRONTEND ERROR] Failed to initialize tracks/stream:", err);
        setAudioTracks([{ index: 0, displayName: 'Fallback Audio' }]);
        setSubTracks([]);
        setStreamSrc(src);
      }
    }
    initStreamingAndTracks();
  }, [src, handleSubChange]);

  const handleAudioChange = async (trackIndex: number) => {
    console.log("🔊 Switching to audio stream index:", trackIndex);
    setActiveAudio(trackIndex);
    setActiveMenu(null);

    try {
      setIsLoading(true);
      const serverUrl: string = await invoke('set_active_media_stream', { 
        videoPath: src, 
        audioIndex: trackIndex 
      });
      
      // 🔥 ASLI ABSOLUTE TIME NIKALO: Purana Offset + Browser ka current time
      const currentBrowserTime = videoRef.current ? videoRef.current.currentTime : 0;
      const absoluteCurrentTime = streamOffsetRef.current + currentBrowserTime;
      
      // Naya offset lock karo
      streamOffsetRef.current = absoluteCurrentTime;

      const safeTime = Number(absoluteCurrentTime).toFixed(3);
      const newStreamUrl = `${serverUrl}?audio=${trackIndex}&start=${safeTime}&t=${Date.now()}`;
      
      setStreamSrc(newStreamUrl);

      if (videoRef.current) {
        videoRef.current.src = newStreamUrl;
        videoRef.current.load();
        videoRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error("Video play error during audio switch:", err);
          }
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error("❌ Failed to switch audio stream on backend:", err);
      setIsLoading(false);
    }
  };

  // 🔥 CUSTOM SEEK FUNCTION: Asli absolute target time ko offset par set karega
  const seekToStream = (targetTime: number) => {
    if (!src || !videoRef.current) return;
    setIsLoading(true);
    
    streamOffsetRef.current = targetTime;
    const safeTime = Number(targetTime).toFixed(3);
    const newStreamUrl = `http://127.0.0.1:39393/stream?start=${safeTime}&t=${Date.now()}`;
    
    setStreamSrc(newStreamUrl);
    
    videoRef.current.src = newStreamUrl;
    videoRef.current.load();
    videoRef.current.play().catch((err) => {
      if (err.name !== 'AbortError') {
        console.error("Video play error during seek:", err);
      }
    });
    
    setIsLoading(false);
  };

  return {
    activeMenu, setActiveMenu,
    audioTracks, activeAudio, handleAudioChange,
    subTracks, activeSub, handleSubChange, activeSubUrl,
    streamSrc,
    mediaDuration,
    seekToStream,
    streamOffsetRef // 🔥 Exported so useVideoPlayer can calculate true absolute time
  };
}