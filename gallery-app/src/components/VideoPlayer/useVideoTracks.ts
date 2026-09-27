// src/components/VideoPlayer/useVideoTracks.ts
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useVideoTracks(src: string, videoRef: React.RefObject<HTMLVideoElement>, setIsLoading: (val: boolean) => void) {
  const [activeMenu, setActiveMenu] = useState<'speed' | 'audio' | 'sub' | null>(null);
  
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [activeAudio, setActiveAudio] = useState<number>(0);
  
  const [subTracks, setSubTracks] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<number>(-1);
  const [activeSubUrl, setActiveSubUrl] = useState<string | null>(null);

  // 🔥 Playable stream URL jo video tag mein jayega
  const [streamSrc, setStreamSrc] = useState<string>(src);

  useEffect(() => {
    async function initStreamingAndTracks() {
      if (!src) return;
      try {
        console.log("🚀 [FRONTEND] Invoking get_video_tracks with src:", src);
        // 🔥 Rust backend ab { tracks: [...], duration: number } object return karta hai
        const metadata: any = await invoke('get_video_tracks', { videoPath: src });
        console.log("🎯 [FRONTEND] Response from Rust metadata:", metadata);
        
        const tracks = metadata.tracks || [];
        
        const audio = tracks
          .filter((t: any) => t.codec_type === 'audio')
          .map((t: any, idx: number) => ({
            ...t,
            displayName: t.title && t.title.length > 0 
              ? t.title 
              : `Audio ${idx + 1} (${t.language.toUpperCase()})`
          }));

        const subs = tracks
          .filter((t: any) => t.codec_type === 'subtitle')
          .map((t: any, idx: number) => ({
            ...t,
            displayName: t.title && t.title.length > 0 
              ? t.title 
              : `Subtitle ${idx + 1} (${t.language.toUpperCase()})`
          }));
        
        let defaultAudioIdx = 0;
        if (audio.length > 0) {
          setAudioTracks(audio);
          defaultAudioIdx = audio[0].index; // Pehla audio track index uthao
          setActiveAudio(defaultAudioIdx);
        } else {
          setAudioTracks([{ index: 0, displayName: 'Default Audio (Stream 1)' }]);
          setActiveAudio(0);
        }

        if (subs.length > 0) {
          setSubTracks(subs);
        } else {
          setSubTracks([]); 
        }

        setActiveSub(-1);
        setActiveSubUrl(null);

        // 🔥 INITIAL STREAM SETUP: Video mount hote hi pehle audio track ke sath backend stream activate karo
        setIsLoading(true);
        const serverUrl: string = await invoke('set_active_media_stream', { 
          videoPath: src, 
          audioIndex: defaultAudioIdx 
        });
        
        // Cache buster add karke stream URL set karo taaki browser turant stream play kare
        const activeStreamUrl = `${serverUrl}?t=${Date.now()}`;
        setStreamSrc(activeStreamUrl);
        setIsLoading(false);

        // Agar video element pehle se ready hai toh safe play trigger karo
        if (videoRef.current) {
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
        setStreamSrc(src); // Fallback to raw file if error
      }
    }
    initStreamingAndTracks();
  }, [src]);

  // 🔥 AUDIO CHANGE: Backend par audio index update karke video stream reload karna
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
      
      // 🔥 Timestamp add karke naya stream URL generate karna taaki FFmpeg naye audio track ke sath restart ho
      const newStreamUrl = `${serverUrl}?audio=${trackIndex}&t=${Date.now()}`;
      setStreamSrc(newStreamUrl);

      // Agar video reference maujood hai toh current time save karke reload karo
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        videoRef.current.src = newStreamUrl;
        videoRef.current.currentTime = currentTime;
        
        // 🔥 Safe play call with AbortError filtering
        videoRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error("Video play error during audio switch:", err);
          }
        });
      }

      setIsLoading(false);
      console.log("🚀 [STREAM] Successfully switched audio stream via backend!");
    } catch (err) {
      console.error("❌ Failed to switch audio stream on backend:", err);
      setIsLoading(false);
    }
  };

  const handleSubChange = async (trackIndex: number) => {
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
  };

  return {
    activeMenu, setActiveMenu,
    audioTracks, activeAudio, handleAudioChange,
    subTracks, activeSub, handleSubChange, activeSubUrl,
    streamSrc // 🔥 Exporting this so VideoPlayer index.tsx can use it as video src
  };
}