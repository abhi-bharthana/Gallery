// src/hooks/useSystemHooks.ts
import { useEffect } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LocalImage } from './useGalleryData';

export function useSystemHooks(
  setSelectedImage: (img: LocalImage | null) => void,
  setShowSplash: (show: boolean) => void
) {
  // 🔥 1. OS File Association Check (Open with AUVEM)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const checkInitialFile = async () => {
      try {
        const filePath: string | null = await invoke('get_opened_file');
        if (filePath) {
          const normalizedPath = filePath.replace(/\\/g, '/');
          const filename = normalizedPath.split('/').pop() || 'Image';
          
          setSelectedImage({
            id: 'external-view-' + Date.now().toString(),
            url: convertFileSrc(normalizedPath),
            rawPath: normalizedPath, 
            timestamp: Math.floor(Date.now() / 1000),
            filename, 
            width: 800, 
            height: 800, 
            type: 'image' 
          } as LocalImage);
          
          setShowSplash(false);
        } else {
          timer = setTimeout(() => setShowSplash(false), 1500);
        }
      } catch (err) {
        console.error("External file check failed:", err);
        timer = setTimeout(() => setShowSplash(false), 1500);
      }
    };

    checkInitialFile();
    return () => { if (timer) clearTimeout(timer); };
  }, [setSelectedImage, setShowSplash]);

  // 🔥 2. F11 Fullscreen Native Toggle
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault(); 
        const appWindow = getCurrentWindow();
        await appWindow.setFullscreen(!(await appWindow.isFullscreen()));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}