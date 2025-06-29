import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  lastOnline: Date | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown',
    lastOnline: null
  });

  const { toast } = useToast();

  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setStatus(prev => {
        const newStatus = {
          ...prev,
          isOnline,
          connectionType: connection?.effectiveType || 'unknown',
          isSlowConnection: connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g',
          lastOnline: isOnline ? new Date() : prev.lastOnline
        };

        // Show toast notifications for connection changes
        if (isOnline && !prev.isOnline) {
          toast({
            title: "Connection restored",
            description: "You're back online. Data will sync automatically.",
            duration: 3000,
          });
        } else if (!isOnline && prev.isOnline) {
          toast({
            title: "Connection lost",
            description: "You're offline. Changes will be saved locally until connection returns.",
            variant: "destructive",
            duration: 5000,
          });
        }

        return newStatus;
      });
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality periodically
    const checkConnection = () => {
      if (!navigator.onLine) return;

      const startTime = performance.now();
      
      // Ping a small endpoint to test connection speed
      fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
        .then(() => {
          const duration = performance.now() - startTime;
          setStatus(prev => ({
            ...prev,
            isSlowConnection: duration > 2000 // Consider slow if > 2 seconds
          }));
        })
        .catch(() => {
          // Network error - might be offline
          setStatus(prev => ({
            ...prev,
            isOnline: false
          }));
        });
    };

    // Check connection quality every 30 seconds
    const intervalId = setInterval(checkConnection, 30000);

    // Initial check
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [toast]);

  return status;
}