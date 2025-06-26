import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/components/DataTable';

interface SearchFilters {
  type: 'all' | 'obituaries' | 'memorials';
  dateFrom?: string;
  dateTo?: string;
  funeralHomeId?: number;
}

interface SearchResult {
  id: number;
  type: 'obituary' | 'memorial';
  title: string;
  createdAt: string;
  funeralHomeId?: number;
  status: string;
}

interface SearchResponse {
  obituaries: SearchResult[];
  memorials: SearchResult[];
  total: number;
}

interface SearchInterfaceProps {
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

export default function SearchInterface({ onResultSelect, className = '' }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({ type: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search query with filters
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['/api/search', debouncedQuery, filters],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return { obituaries: [], memorials: [], total: 0 };
      
      const params = new URLSearchParams({
        q: debouncedQuery,
        type: filters.type,
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.funeralHomeId && { funeralHomeId: filters.funeralHomeId.toString() })
      });

      const res = await apiRequest('GET', `/api/search?${params}`);
      return res.json() as Promise<SearchResponse>;
    },
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Funeral homes for filter dropdown
  const { data: funeralHomes = [] } = useQuery({
    queryKey: ['/api/funeral-homes'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/funeral-homes');
      return res.json();
    }
  });

  // Combined and sorted results
  const allResults = useMemo(() => {
    if (!searchResults) return [];
    
    const combined = [
      ...searchResults.obituaries,
      ...searchResults.memorials
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return combined;
  }, [searchResults]);

  const clearFilters = () => {
    setFilters({ type: 'all' });
    setShowFilters(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.funeralHomeId) count++;
    return count;
  }, [filters]);

  return (
    <div className={`search-interface space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search obituaries and memorials..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          <Filter className="h-4 w-4 mr-1" />
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Search Filters</CardTitle>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Content Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Content Type
                </label>
                <Select
                  value={filters.type}
                  onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="obituaries">Obituaries Only</SelectItem>
                    <SelectItem value="memorials">Memorials Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  From Date
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateFrom: e.target.value || undefined 
                  }))}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  To Date
                </label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateTo: e.target.value || undefined 
                  }))}
                />
              </div>

              {/* Funeral Home */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Funeral Home
                </label>
                <Select
                  value={filters.funeralHomeId?.toString() || ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    funeralHomeId: value ? parseInt(value) : undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All funeral homes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Funeral Homes</SelectItem>
                    {funeralHomes.map((fh: any) => (
                      <SelectItem key={fh.id} value={fh.id.toString()}>
                        {fh.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {query && (
        <div className="space-y-3">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              Searching...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              Search failed. Please try again.
            </div>
          )}

          {searchResults && searchResults.total === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              No results found for "{query}"
            </div>
          )}

          {searchResults && searchResults.total > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {searchResults.total} result{searchResults.total !== 1 ? 's' : ''} found
                </p>
                <div className="flex space-x-2">
                  {searchResults.obituaries.length > 0 && (
                    <Badge variant="outline">
                      {searchResults.obituaries.length} obituar{searchResults.obituaries.length !== 1 ? 'ies' : 'y'}
                    </Badge>
                  )}
                  {searchResults.memorials.length > 0 && (
                    <Badge variant="outline">
                      {searchResults.memorials.length} memorial{searchResults.memorials.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {allResults.map((result) => (
                  <Card 
                    key={`${result.type}-${result.id}`}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onResultSelect?.(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{result.title}</h3>
                            <Badge 
                              variant={result.type === 'obituary' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {result.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {result.status}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(result.createdAt)}
                            </span>
                            {result.funeralHomeId && (
                              <span className="flex items-center">
                                <Building2 className="h-3 w-3 mr-1" />
                                Funeral Home #{result.funeralHomeId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}