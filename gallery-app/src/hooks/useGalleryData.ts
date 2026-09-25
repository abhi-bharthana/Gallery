import { useState, useEffect, useCallback } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';

export interface LocalImage {
  id: string;
  url: string;        // Asset URL (Frontend mein render karne ke liye)
  rawPath: string;    // 🔥 Raw Path (Rust ko thumbnail banane ke liye dene ke liye)
  timestamp: number;
  filename: string;
}

export interface Album {
  id: string;
  name: string;
  photos: string[];
}

export function useGalleryData() {
  const [allPhotos, setAllPhotos] = useState<LocalImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('auvem_favs') || '[]'));
  const [trash, setTrash] = useState<string[]>(() => JSON.parse(localStorage.getItem('auvem_trash') || '[]'));
  const [albums, setAlbums] = useState<Album[]>(() => JSON.parse(localStorage.getItem('auvem_albums') || '[]'));

  useEffect(() => localStorage.setItem('auvem_favs', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('auvem_trash', JSON.stringify(trash)), [trash]);
  useEffect(() => localStorage.setItem('auvem_albums', JSON.stringify(albums)), [albums]);

  const syncImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem('synced_folders');
      const directories = saved ? JSON.parse(saved) : [];
      if (directories.length === 0) {
        setAllPhotos([]);
        setIsLoading(false);
        return;
      }
      const fileData: any[] = await invoke('fetch_synced_images', { directories });
      const loaded: LocalImage[] = fileData.map((img) => ({
        id: img.id,
        url: convertFileSrc(img.url),
        rawPath: img.url, // 🔥 Ye add kiya gaya hai
        timestamp: img.timestamp,
        filename: img.filename,
      }));
      
      setAllPhotos(loaded);

      // 🔥 GHOST DATA CLEANUP LOGIC 🔥
      const validIds = new Set(loaded.map((img) => img.id));

      // 1. Clean Favorites
      setFavorites((prev) => {
        const cleaned = prev.filter((id) => validIds.has(id));
        if (cleaned.length !== prev.length) localStorage.setItem('auvem_favs', JSON.stringify(cleaned));
        return cleaned;
      });

      // 2. Clean Trash
      setTrash((prev) => {
        const cleaned = prev.filter((id) => validIds.has(id));
        if (cleaned.length !== prev.length) localStorage.setItem('auvem_trash', JSON.stringify(cleaned));
        return cleaned;
      });

      // 3. Clean Albums
      setAlbums((prev) => {
        let changed = false;
        const cleaned = prev.map((album) => {
          const validPhotos = album.photos.filter((id) => validIds.has(id));
          if (validPhotos.length !== album.photos.length) changed = true;
          return { ...album, photos: validPhotos };
        });
        if (changed) localStorage.setItem('auvem_albums', JSON.stringify(cleaned));
        return cleaned;
      });

    } catch (error) {
      console.error('Scan Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncImages();
  }, [syncImages]);

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
    favorites,
    trash,
    albums,
    syncImages,
    toggleFavorite,
    moveToTrash,
    restoreFromTrash,
    createAlbum,
    addToAlbum
  };
}