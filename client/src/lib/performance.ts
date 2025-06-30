// Performance monitoring and optimization utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Record<string, number[]> = {};
  private cache: Record<string, any> = {};
  private maxCacheSize = 100;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track API response times
  trackApiCall(endpoint: string, duration: number) {
    if (!this.metrics[endpoint]) {
      this.metrics[endpoint] = [];
    }
    this.metrics[endpoint].push(duration);
    
    // Keep only last 50 measurements
    if (this.metrics[endpoint].length > 50) {
      this.metrics[endpoint].shift();
    }
  }

  // Get average response time for endpoint
  getAverageResponseTime(endpoint: string): number {
    const times = this.metrics[endpoint];
    if (!times || times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // Memory-efficient caching
  setCache(key: string, value: any, ttl = 5 * 60 * 1000): void {
    // Simple cache management
    if (Object.keys(this.cache).length >= this.maxCacheSize) {
      const firstKey = Object.keys(this.cache)[0];
      delete this.cache[firstKey];
    }

    this.cache[key] = {
      value,
      timestamp: Date.now(),
      ttl
    };
  }

  getCache(key: string): any | null {
    const cached = this.cache[key];
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      delete this.cache[key];
      return null;
    }

    return cached.value;
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary: Record<string, any> = {};
    
    for (const [endpoint, times] of Object.entries(this.metrics)) {
      summary[endpoint] = {
        averageTime: this.getAverageResponseTime(endpoint),
        callCount: times.length,
        lastCall: times[times.length - 1]
      };
    }

    return {
      apiMetrics: summary,
      cacheSize: Object.keys(this.cache).length
    };
  }
}

// Enhanced API request wrapper with caching and performance tracking
export async function cachedApiRequest(
  method: string, 
  url: string, 
  options: RequestInit = {},
  cacheKey?: string,
  cacheTtl = 5 * 60 * 1000
): Promise<Response> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = performance.now();

  // Check cache for GET requests
  if (method === 'GET' && cacheKey) {
    const cached = monitor.getCache(cacheKey);
    if (cached) {
      // Return cached response
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const duration = performance.now() - startTime;
    monitor.trackApiCall(url, duration);

    // Cache successful GET responses
    if (method === 'GET' && response.ok && cacheKey) {
      const data = await response.clone().json();
      monitor.setCache(cacheKey, data, cacheTtl);
    }

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    monitor.trackApiCall(url, duration);
    throw error;
  }
}

// Image lazy loading with intersection observer
export class LazyImageLoader {
  private observer: IntersectionObserver;
  private loadedImages = new Set<string>();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer.unobserve(img);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  observe(img: HTMLImageElement) {
    if (this.loadedImages.has(img.src)) {
      this.loadImage(img);
      return;
    }
    this.observer.observe(img);
  }

  private loadImage(img: HTMLImageElement) {
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc && !this.loadedImages.has(dataSrc)) {
      img.src = dataSrc;
      img.removeAttribute('data-src');
      this.loadedImages.add(dataSrc);
      
      img.onload = () => {
        img.classList.add('loaded');
      };
    }
  }

  disconnect() {
    this.observer.disconnect();
  }
}

// Debounce utility for search and input handling
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Performance-optimized query client configuration
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount: number, error: any) => {
        // Don't retry 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
};

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.scripts);
    const totalSize = scripts.reduce((sum, script) => {
      return sum + (script.src ? 0 : script.innerHTML.length);
    }, 0);
    
    // Bundle size tracking for development
  }
}