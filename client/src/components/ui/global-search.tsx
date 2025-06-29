import React, { useState, useEffect } from 'react';
import { Search, Filter, X, FileText, Users, Calendar, Settings } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import LoadingSpinner from './loading-spinner';

interface SearchResult {
  id: number;
  type: 'obituary' | 'finalspace' | 'survey' | 'evaluation';
  title: string;
  description: string;
  date: string;
  status?: string;
  author?: string;
  url: string;
}

interface SearchFilters {
  contentType: string[];
  dateRange: string;
  status: string[];
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const contentTypeIcons = {
  obituary: FileText,
  finalspace: Users,
  survey: Calendar,
  evaluation: Settings
};

const contentTypeLabels = {
  obituary: 'Obituary',
  finalspace: 'Memorial',
  survey: 'Survey',
  evaluation: 'Evaluation'
};

export function GlobalSearch({ isOpen, onClose, className }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    contentType: [],
    dateRange: 'all',
    status: []
  });
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: searchResults = [], isLoading, error } = useQuery<SearchResult[]>({
    queryKey: ['/api/search', { 
      q: debouncedSearchTerm, 
      ...filters,
      contentType: filters.contentType.length > 0 ? filters.contentType.join(',') : undefined,
      status: filters.status.length > 0 ? filters.status.join(',') : undefined
    }],
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleFilterChange = (filterType: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType])
        ? prev[filterType].includes(value)
          ? prev[filterType].filter(item => item !== value)
          : [...prev[filterType], value]
        : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      contentType: [],
      dateRange: 'all',
      status: []
    });
  };

  const activeFilterCount = 
    filters.contentType.length + 
    filters.status.length + 
    (filters.dateRange !== 'all' ? 1 : 0);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-auto p-4">
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search obituaries, memorials, surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                  autoFocus
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Content Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(contentTypeLabels).map(([type, label]) => (
                      <Button
                        key={type}
                        variant={filters.contentType.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('contentType', type)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Date Range</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Time' },
                      { value: '7d', label: 'Last 7 Days' },
                      { value: '30d', label: 'Last 30 Days' },
                      { value: '90d', label: 'Last 90 Days' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={filters.dateRange === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('dateRange', value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="max-h-96 overflow-y-auto">
            {debouncedSearchTerm.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search across all content...</p>
                <p className="text-sm mt-2">Search obituaries, memorials, surveys, and evaluations</p>
              </div>
            )}

            {debouncedSearchTerm.length >= 2 && isLoading && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner text="Searching..." />
              </div>
            )}

            {debouncedSearchTerm.length >= 2 && !isLoading && error && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Error searching content. Please try again.</p>
              </div>
            )}

            {debouncedSearchTerm.length >= 2 && !isLoading && !error && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found for "{debouncedSearchTerm}"</p>
                <p className="text-sm mt-2">Try adjusting your search terms or filters</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((result) => {
                  const IconComponent = contentTypeIcons[result.type];
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        window.location.href = result.url;
                        onClose();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <IconComponent className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {result.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {contentTypeLabels[result.type]}
                            </Badge>
                            {result.status && (
                              <Badge variant="outline" className="text-xs">
                                {result.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {result.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{result.date}</span>
                            {result.author && <span>by {result.author}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default GlobalSearch;