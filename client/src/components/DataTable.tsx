import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Plus } from "lucide-react";

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { value: string; label: string }[];
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title?: string;
  data: any[];
  columns: TableColumn[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  createButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  createButtons?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  }[];
  actions?: (row: any) => {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  }[];
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
}

type SortDirection = "asc" | "desc" | null;

export default function DataTable({
  title,
  data,
  columns,
  isLoading = false,
  searchPlaceholder = "Search...",
  emptyMessage,
  onRowClick,
  createButton,
  createButtons,
  actions,
  emptyState
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Initialize filters for filterable columns
  const filterableColumns = columns.filter(col => col.filterable);

  const handleSort = (columnKey: string) => {
    if (!columns.find(col => col.key === columnKey)?.sortable) return;
    
    if (sortColumn === columnKey) {
      setSortDirection(prev => {
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return <ArrowUpDown className="w-4 h-4" />;
    if (sortDirection === "asc") return <ArrowUp className="w-4 h-4" />;
    if (sortDirection === "desc") return <ArrowDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        columns.some(col => {
          const value = item[col.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue && filterValue !== "all") {
        filtered = filtered.filter(item => {
          const value = item[columnKey];
          return value && value.toString().toLowerCase() === filterValue.toLowerCase();
        });
      }
    });

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === "asc" ? 1 : -1;
        if (bValue == null) return sortDirection === "asc" ? -1 : 1;
        
        // Handle different data types
        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === "asc" ? comparison : -comparison;
        }
        
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        
        // Handle dates
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === "asc" 
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }
        
        // Convert to string for comparison
        const aStr = aValue.toString();
        const bStr = bValue.toString();
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns]);

  if (isLoading) {
    return (
      <Card className="card-elevated">
        {title && (
          <CardHeader>
            <CardTitle className="heading-lg">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-lg">
          <div className="skeleton-professional h-6 w-1/4 mb-6"></div>
          <div className="space-md">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-professional h-14 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      {title && (
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="heading-lg text-foreground">
              {title} ({processedData.length}
              {searchTerm || Object.values(filters).some(f => f && f !== "all") 
                ? ` of ${data.length} total` 
                : ""})
            </CardTitle>
            {(createButton || createButtons) && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {createButton && (
                  <Button 
                    onClick={createButton.onClick} 
                    className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:w-auto"
                    size="sm"
                  >
                    {createButton.icon ? (
                      <createButton.icon className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {createButton.label}
                  </Button>
                )}
                {createButtons && createButtons.map((button, index) => {
                  const IconComponent = button.icon;
                  return (
                    <Button 
                      key={index}
                      onClick={button.onClick} 
                      variant={button.variant || "default"}
                      className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap w-full sm:w-auto"
                      size="sm"
                    >
                      {IconComponent ? (
                        <IconComponent className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {button.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      {!title && createButton && (
        <CardHeader>
          <div className="flex justify-end">
            <Button onClick={createButton.onClick} className="flex items-center gap-2">
              {createButton.icon ? (
                <createButton.icon className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {createButton.label}
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-elevated pl-12 h-11 focus-professional"
              />
            </div>
          </div>
          {filterableColumns.length > 0 && (
            <div className="flex gap-3">
              {filterableColumns.map(column => (
                <Select
                  key={column.key}
                  value={filters[column.key] || "all"}
                  onValueChange={(value) => handleFilterChange(column.key, value)}
                >
                  <SelectTrigger className="input-elevated w-44 h-11 focus-professional">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder={`All ${column.title}`} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="modal-glass">
                    <SelectItem value="all">All {column.title}</SelectItem>
                    {column.filterOptions?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        ) : processedData.length === 0 ? (
          <div className="text-center py-12">
            {emptyState?.icon}
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {emptyState?.title || "No data found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {emptyState?.description || "No items match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(column => (
                    <TableHead 
                      key={column.key}
                      className={column.sortable ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.title}
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </TableHead>
                  ))}
                  {actions && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedData.map((row, index) => (
                  <TableRow 
                    key={row.id || `row-${index}`}
                    className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map(column => (
                      <TableCell key={`${row.id || index}-${column.key}`}>
                        {column.render 
                          ? column.render(row[column.key], row)
                          : row[column.key] || "-"
                        }
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {actions(row).map((action, actionIndex) => {
                            const IconComponent = action.icon;
                            return (
                              <Button
                                key={`${row.id || index}-action-${actionIndex}`}
                                size="sm"
                                variant={action.variant || "outline"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick();
                                }}
                                className="flex items-center gap-1"
                              >
                                <IconComponent className="w-4 h-4" />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to create badge renderer
export const createBadgeRenderer = (getColor: (value: string) => string) => 
  (value: string) => (
    <Badge className={getColor(value)}>
      {value}
    </Badge>
  );

// Helper function to format dates
export const formatDate = (date: string | Date) => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString();
};

// Helper function to create action buttons
export const createActionButtons = (actions: Array<{
  icon: React.ReactNode;
  onClick: (row: any) => void;
  variant?: "default" | "outline" | "ghost";
  title?: string;
}>) => (value: any, row: any) => (
  <div className="flex items-center gap-2">
    {actions.map((action, index) => (
      <Button
        key={index}
        size="sm"
        variant={action.variant || "outline"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Button action triggered
          action.onClick(row);
        }}
        title={action.title}
      >
        {action.icon}
      </Button>
    ))}
  </div>
);