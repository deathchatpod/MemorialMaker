import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function MobileMenu({ isOpen, onToggle, children }: MobileMenuProps) {
  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onToggle} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}

interface CollapsibleSectionProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleSection({ 
  title, 
  badge, 
  children, 
  defaultExpanded = false 
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="w-full">
      <CardHeader 
        className="cursor-pointer pb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ResponsiveGrid({ 
  children, 
  columns = { sm: 1, md: 2, lg: 3, xl: 4 } 
}: ResponsiveGridProps) {
  const gridClass = `grid gap-4 ${
    columns.sm ? `grid-cols-${columns.sm}` : 'grid-cols-1'
  } ${
    columns.md ? `md:grid-cols-${columns.md}` : 'md:grid-cols-2'
  } ${
    columns.lg ? `lg:grid-cols-${columns.lg}` : 'lg:grid-cols-3'
  } ${
    columns.xl ? `xl:grid-cols-${columns.xl}` : 'xl:grid-cols-4'
  }`;

  return (
    <div className={gridClass}>
      {children}
    </div>
  );
}

// Hook for responsive design
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Mobile-optimized card component
interface MobileCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MobileCard({ 
  title, 
  subtitle, 
  actions, 
  children, 
  className = "" 
}: MobileCardProps) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium leading-tight">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {actions && (
            <div className="flex flex-wrap gap-2 pt-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

// Touch-friendly button sizes
export const mobileButtonSizes = {
  sm: "h-8 px-3 text-xs",
  default: "h-10 px-4 py-2",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10"
} as const;