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
  const [albums, setAlbums] = useState<Album[]>(() => JSON.parse(localStorage.getItem('auvem_albums') || '[]'));

  useEffect(() => localStorage.setItem('auvem_favs', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('auvem_trash', JSON.stringify(trash)), [trash]);
  useEffect(() => localStorage.setItem('auvem_albums', JSON.stringify(albums)), [albums]);

  // 🔥 1. LIGHTNING FAST STARTUP: Sirf SQLite Database se data lao (No Disk Scan on Refresh!)
  const loadFromDatabase = useCallback(async (append: boolean = false, offset: number = 0) => {
    try {
      setIsLoading(true);
      const fileData: any[] = await invoke('get_filtered_chunk', { 
        tab: 'All Photos', 
        search: '', 
        limit: CHUNK_SIZE, 
        offset 
      });

      const loaded: LocalMedia[] = fileData.map((img, index) => ({
        id: img.id && img.id.trim() !== '' ? img.id : `media-${offset + index}-${Date.now()}`,
        url: convertFileSrc(img.url),
        rawPath: img.url, 
        timestamp: img.timestamp,
        filename: img.filename,
        width: img.width || 800,  
        height: img.height || 800,
        type: img.media_type || 'image',
      }));
      
      setAllPhotos((prev) => append ? [...prev, ...loaded] : loaded);
      setHasMore(fileData.length === CHUNK_SIZE);

    } catch (error) {
      console.error('Database Load Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔥 2. MANUAL SYNC: Disk scan sirf tab chalega jab user explicitly boléga
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

      // Disk scan and DB re-index
      await invoke('fetch_synced_images', { directories });
      
      // Scan ke baad fresh data load karo
      await loadFromDatabase(false, 0);

    } catch (error) {
      console.error('Scan Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromDatabase]);

  // 🔥 App khulte hi bina disk scan kiye seedha DB se load karega (Instant Boot)
  useEffect(() => {
    const saved = localStorage.getItem('synced_folders');
    const directories = saved ? JSON.parse(saved) : [];
    
    if (directories.length > 0) {
      loadFromDatabase(false, 0); // Instant load from cache
    } else {
      setIsLoading(false);
      setHasMore(false);
    }
  }, [loadFromDatabase]);

  // 🔥 Infinite Scroll (Load More)
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
      setAlbums((prev) => [...prev, newAlbum]);
    }
  };

  const addToAlbum = (photoId: string, albumId: string) => {
    setAlbums((prev) =>
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
    albums,
    syncImages, // Ye ab sirf manual sync ke liye use hoga
    toggleFavorite,
    moveToTrash,
    restoreFromTrash,
    createAlbum,
    addToAlbum
  };
}