import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid, Move, MousePointer2, Layers } from 'lucide-react';

interface GridSystemProps {
  enabled: boolean;
  size: number;
  opacity: number;
  snapToGrid: boolean;
  showGrid: boolean;
  positioningMode: 'free' | 'grid' | 'snap';
  onToggle: (enabled: boolean) => void;
  onSizeChange: (size: number) => void;
  onOpacityChange: (opacity: number) => void;
  onSnapToggle: (snap: boolean) => void;
  onShowToggle: (show: boolean) => void;
  onModeChange: (mode: 'free' | 'grid' | 'snap') => void;
}

export function GridSystem({
  enabled,
  size,
  opacity,
  snapToGrid,
  showGrid,
  positioningMode,
  onToggle,
  onSizeChange,
  onOpacityChange,
  onSnapToggle,
  onShowToggle,
  onModeChange
}: GridSystemProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5" />
          Grid & Positioning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Grid Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="grid-enabled">Enable Grid System</Label>
          <Switch
            id="grid-enabled"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>

        {enabled && (
          <>
            {/* Positioning Mode */}
            <div className="space-y-2">
              <Label>Positioning Mode</Label>
              <Select value={positioningMode} onValueChange={onModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="w-4 h-4" />
                      Free Form
                    </div>
                  </SelectItem>
                  <SelectItem value="snap">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4" />
                      Snap to Grid
                    </div>
                  </SelectItem>
                  <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Grid Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {positioningMode === 'free' && 'Elements can be positioned anywhere'}
                {positioningMode === 'snap' && 'Elements snap to grid when moved'}
                {positioningMode === 'grid' && 'Elements are constrained to grid positions'}
              </div>
            </div>

            {/* Grid Size */}
            <div className="space-y-2">
              <Label>Grid Size: {size}px</Label>
              <Slider
                value={[size]}
                onValueChange={([value]) => onSizeChange(value)}
                min={10}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            {/* Show Grid */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-grid">Show Grid Lines</Label>
              <Switch
                id="show-grid"
                checked={showGrid}
                onCheckedChange={onShowToggle}
              />
            </div>

            {/* Grid Opacity */}
            {showGrid && (
              <div className="space-y-2">
                <Label>Grid Opacity: {Math.round(opacity * 100)}%</Label>
                <Slider
                  value={[opacity]}
                  onValueChange={([value]) => onOpacityChange(value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            )}

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSizeChange(20);
                    onModeChange('snap');
                    onShowToggle(true);
                  }}
                >
                  Fine Grid (20px)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSizeChange(30);
                    onModeChange('snap');
                    onShowToggle(true);
                  }}
                >
                  Standard (30px)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSizeChange(40);
                    onModeChange('grid');
                    onShowToggle(true);
                  }}
                >
                  Large Grid (40px)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onModeChange('free');
                    onShowToggle(false);
                  }}
                >
                  Free Form
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function GridOverlay({ 
  size, 
  opacity, 
  show, 
  canvasWidth, 
  canvasHeight 
}: { 
  size: number; 
  opacity: number; 
  show: boolean; 
  canvasWidth: number; 
  canvasHeight: number; 
}) {
  if (!show) return null;

  const lines = [];
  
  // Vertical lines
  for (let x = 0; x <= canvasWidth; x += size) {
    lines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={canvasHeight}
        stroke="#3b82f6"
        strokeWidth="1"
        opacity={opacity}
      />
    );
  }
  
  // Horizontal lines
  for (let y = 0; y <= canvasHeight; y += size) {
    lines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={canvasWidth}
        y2={y}
        stroke="#3b82f6"
        strokeWidth="1"
        opacity={opacity}
      />
    );
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ zIndex: 1 }}
    >
      {lines}
    </svg>
  );
}

export default GridSystem;