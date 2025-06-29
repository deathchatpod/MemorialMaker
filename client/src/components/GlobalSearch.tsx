import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, Building, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: number;
  type: 'obituary' | 'memorial' | 'review';
  title: string;
  description: string;
  date: string;
  funeralHome?: string;
  url: string;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [contentType, setContentType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [funeralHome, setFuneralHome] = useState<string>('all');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search query with caching
  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ['/api/search', debouncedSearchTerm, contentType, dateRange, funeralHome],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim()) return [];
      
      const params = new URLSearchParams({
        q: debouncedSearchTerm,
        type: contentType,
        dateRange,
        funeralHome
      });
      
      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedSearchTerm.trim().length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get funeral homes for filter
  const { data: funeralHomes = [] } = useQuery({
    queryKey: ['/api/funeral-homes'],
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const resultsByType = useMemo(() => {
    const grouped = {
      obituaries: [] as SearchResult[],
      memorials: [] as SearchResult[],
      reviews: [] as SearchResult[]
    };
    
    searchResults.forEach((result: SearchResult) => {
      if (result.type === 'obituary') grouped.obituaries.push(result);
      else if (result.type === 'memorial') grouped.memorials.push(result);
      else if (result.type === 'review') grouped.reviews.push(result);
    });
    
    return grouped;
  }, [searchResults]);

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.url;
    onClose?.();
  };

  const clearFilters = () => {
    setContentType('all');
    setDateRange('all');
    setFuneralHome('all');
  };

  const hasActiveFilters = contentType !== 'all' || dateRange !== 'all' || funeralHome !== 'all';

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border-border">
      <CardContent className="p-6">
        {/* Search Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search obituaries, memorials, and reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
              autoFocus
            />
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-auto min-w-[120px] bg-input border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="obituary">Obituaries</SelectItem>
              <SelectItem value="memorial">Memorials</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-auto min-w-[120px] bg-input border-border">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={funeralHome} onValueChange={setFuneralHome}>
            <SelectTrigger className="w-auto min-w-[140px] bg-input border-border">
              <Building className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Funeral Homes</SelectItem>
              {funeralHomes.map((fh: any) => (
                <SelectItem key={fh.id} value={fh.id.toString()}>
                  {fh.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Searching...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              Search failed. Please try again.
            </div>
          )}

          {!isLoading && !error && debouncedSearchTerm.trim().length > 2 && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No results found for "{debouncedSearchTerm}"
            </div>
          )}

          {!isLoading && !error && searchResults.length > 0 && (
            <div className="space-y-4">
              {/* Obituaries */}
              {resultsByType.obituaries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Obituaries ({resultsByType.obituaries.length})
                  </h3>
                  <div className="space-y-2">
                    {resultsByType.obituaries.map((result) => (
                      <SearchResultItem
                        key={`obituary-${result.id}`}
                        result={result}
                        onClick={() => handleResultClick(result)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Memorials */}
              {resultsByType.memorials.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Memorials ({resultsByType.memorials.length})
                  </h3>
                  <div className="space-y-2">
                    {resultsByType.memorials.map((result) => (
                      <SearchResultItem
                        key={`memorial-${result.id}`}
                        result={result}
                        onClick={() => handleResultClick(result)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {resultsByType.reviews.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Reviews ({resultsByType.reviews.length})
                  </h3>
                  <div className="space-y-2">
                    {resultsByType.reviews.map((result) => (
                      <SearchResultItem
                        key={`review-${result.id}`}
                        result={result}
                        onClick={() => handleResultClick(result)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {debouncedSearchTerm.trim().length <= 2 && (
            <div className="text-center py-8 text-muted-foreground">
              Type at least 3 characters to search
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  onClick: () => void;
}

function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'obituary': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'memorial': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'review': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-xs ${getTypeColor(result.type)}`}>
              {result.type}
            </Badge>
            {result.funeralHome && (
              <span className="text-xs text-muted-foreground">
                {result.funeralHome}
              </span>
            )}
          </div>
          <h4 className="font-medium text-foreground truncate">
            {result.title}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {result.description}
          </p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {new Date(result.date).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}