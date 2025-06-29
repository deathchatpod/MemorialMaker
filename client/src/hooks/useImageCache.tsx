import { useState, useEffect } from 'react';

interface CacheItem {
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageCache {
  private cache: Map<string, CacheItem> = new Map();
  private maxSize = 50; // Maximum number of cached images
  private maxAge = 30 * 60 * 1000; // 30 minutes

  async get(url: string): Promise<string | null> {
    const item = this.cache.get(url);
    
    if (!item) return null;
    
    // Check if cache item is expired
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(url);
      return null;
    }
    
    return URL.createObjectURL(item.blob);
  }

  async set(url: string, blob: Blob): Promise<void> {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(url, {
      url,
      blob,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const imageCache = new ImageCache();

export function useImageCache(src: string) {
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cached = await imageCache.get(src);
        if (cached && !isCancelled) {
          setCachedSrc(cached);
          setLoading(false);
          return;
        }

        // Fetch and cache the image
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.statusText}`);
        }

        const blob = await response.blob();
        
        if (!isCancelled) {
          await imageCache.set(src, blob);
          const objectUrl = URL.createObjectURL(blob);
          setCachedSrc(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load image');
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
    };
  }, [src]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (cachedSrc && cachedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(cachedSrc);
      }
    };
  }, [cachedSrc]);

  return { src: cachedSrc || src, loading, error };
}