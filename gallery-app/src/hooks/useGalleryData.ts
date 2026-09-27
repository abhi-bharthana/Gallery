// src/hooks/useGalleryData.ts
import { useState, useEffect, useCallback } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';

export interface LocalMedia {
  id: string;
  url: string;
  rawPath: string;
  timestamp: number;
  filename: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  duration?: number;
  fileSize: number; // 🔥 ADDED: File size support
}
export type LocalImage = LocalMedia;

export interface Album {
  id: string;
  name: string;
  photos: string[];
}

const CHUNK_SIZE = 100;

export function useGalleryData() {
  const [allPhotos, setAllPhotos] = useState<LocalMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('auvem_favs') || '[]'));
  const [trash, setTrash] = useState<string[]>(() => JSON.parse(localStorage.getItem('auvem_trash') || '[]'));
  
  // Alag state: Ek manual albums ke liye, ek auto (folder) albums ke liye
  const [manualAlbums, setManualAlbums] = useState<Album[]>(() => JSON.parse(localStorage.getItem('auvem_albums') || '[]'));
  const [autoAlbums, setAutoAlbums] = useState<Album[]>([]);

  // 🔥 NAYA: Video History State (Progress bar aur Resume ke liye)
  const [videoHistory, setVideoHistory] = useState<Record<string, any>>({});

  useEffect(() => localStorage.setItem('auvem_favs', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('auvem_trash', JSON.stringify(trash)), [trash]);
  useEffect(() => localStorage.setItem('auvem_albums', JSON.stringify(manualAlbums)), [manualAlbums]);

  // 🔥 NAYA: Rust backend se saari history mangwana
  const fetchHistory = useCallback(async () => {
    try {
      const histArray: [string, any][] = await invoke('get_all_history');
      const histMap: Record<string, any> = {};
      
      // Array ko Object(Map) mein convert kar rahe hain taaki path se direct data mil jaye
      histArray.forEach(([path, data]) => {
         histMap[path.replace(/\\/g, '/')] = data; // Windows/Mac paths normalize kar diye
      });
      
      setVideoHistory(histMap);
    } catch (e) {
      console.error("History fetch error:", e);
    }
  }, []);

  // Jaise hi hook load ho, history fetch kar lo
  useEffect(() => { 
    fetchHistory(); 
  }, [fetchHistory]);

  // Backend se folder-albums mangwane ka function
  const fetchAutoAlbums = async () => {
    try {
      const folders: Album[] = await invoke('get_auto_albums');
      setAutoAlbums(folders);
    } catch (e) {
      console.error("Auto albums fetch failed", e);
    }
  };

  const loadFromDatabase = useCallback(async (append: boolean = false, offset: number = 0) => {
    try {
      setIsLoading(true);
      const fileData: any[] = await invoke('get_filtered_chunk', { 
        tab: 'All Photos', 
        search: '', 
        limit: CHUNK_SIZE, 
        offset 
      });
      
      const loaded: LocalMedia[] = fileData.map((img: any, index: number) => ({
        id: img.id && img.id.trim() !== '' ? img.id : `media-${offset + index}-${Date.now()}`,
        url: convertFileSrc(img.url),
        rawPath: img.url, 
        timestamp: img.timestamp,
        filename: img.filename,
        width: img.width || 800,  
        height: img.height || 800,
        type: img.media_type || 'image',
        fileSize: img.file_size || 0, // 🔥 ADDED: Size mapping from DB
      }));
      
      setAllPhotos((prev) => append ? [...prev, ...loaded] : loaded);
      setHasMore(fileData.length === CHUNK_SIZE);

      // Jab DB load ho tabhi folders bhi update kar lo
      if (!append) fetchAutoAlbums();

    } catch (error) {
      console.error('Database Load Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem('synced_folders');
      const directories = saved ? JSON.parse(saved) : [];
      if (directories.length === 0) {
        setAllPhotos([]);
        setIsLoading(false);
        setHasMore(false);
        return;
      }
      
      await invoke('fetch_synced_images', { directories });
      await loadFromDatabase(false, 0);
    } catch (error) {
      console.error('Scan Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromDatabase]);

  useEffect(() => {
    const saved = localStorage.getItem('synced_folders');
    const directories = saved ? JSON.parse(saved) : [];
    
    if (directories.length > 0) {
      loadFromDatabase(false, 0);
    } else {
      setIsLoading(false);
      setHasMore(false);
    }
  }, [loadFromDatabase]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    await loadFromDatabase(true, allPhotos.length);
  }, [isLoading, hasMore, allPhotos.length, loadFromDatabase]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]));
  };

  const moveToTrash = (id: string) => {
    setTrash((prev) => [...prev, id]);
    setFavorites((prev) => prev.filter((fId) => fId !== id));
  };

  const restoreFromTrash = (id: string) => {
    setTrash((prev) => prev.filter((tId) => tId !== id));
  };

  const createAlbum = () => {
    const albumName = prompt('Enter new album name:');
    if (albumName && albumName.trim() !== '') {
      const newAlbum: Album = { id: Date.now().toString(), name: albumName.trim(), photos: [] };
      setManualAlbums((prev) => [...prev, newAlbum]);
    }
  };

  const addToAlbum = (photoId: string, albumId: string) => {
    // Auto albums mein manual add allow nahi karenge kyunki wo folder based hain
    if (albumId.startsWith('auto-album-')) return;
    
    setManualAlbums((prev) =>
      prev.map((album) =>
        album.id === albumId && !album.photos.includes(photoId)
          ? { ...album, photos: [...album.photos, photoId] }
          : album
      )
    );
  };

  return {
    allPhotos,
    isLoading,
    hasMore,
    loadMore, 
    favorites,
    trash,
    albums: [...autoAlbums, ...manualAlbums], // UI ko merge karke bhejenge
    manualAlbums, // TopBar Dropdown sirf inhe show karega
    videoHistory, // 🔥 NAYA: History export kar di
    fetchHistory, // 🔥 NAYA: Function export kar diya taaki close karne par refresh kar sakein
    syncImages,
    toggleFavorite,
    moveToTrash,
    restoreFromTrash,
    createAlbum,
    addToAlbum
  };
}