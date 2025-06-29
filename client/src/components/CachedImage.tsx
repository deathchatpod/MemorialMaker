import { useState } from 'react';
import { useImageCache } from '@/hooks/useImageCache';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function CachedImage({ src, alt, className, width, height, onLoad, onError }: CachedImageProps) {
  const { src: cachedSrc, loading, error } = useImageCache(src);
  const [imageError, setImageError] = useState(false);

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  if (error || imageError) {
    return (
      <div className={`flex items-center justify-center bg-muted border border-border rounded ${className}`} style={{ width, height }}>
        <div className="text-center p-4">
          <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Failed to load image</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted border border-border rounded animate-pulse ${className}`} style={{ width, height }}>
        <ImageIcon className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={cachedSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
}