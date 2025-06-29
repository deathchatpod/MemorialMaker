import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { History, ChevronDown, ChevronRight, RotateCcw, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Version {
  id: number;
  version: number;
  content: string;
  changes: string;
  createdAt: string;
  createdBy: string;
  isCurrent: boolean;
}

interface VersionHistoryProps {
  obituaryId: number;
  onRestore?: (version: Version) => void;
}

export function VersionHistory({ obituaryId, onRestore }: VersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: [`/api/obituaries/${obituaryId}/versions`],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries/${obituaryId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      return response.json();
    },
    enabled: isOpen
  });

  // Show only the latest 2 versions prominently, rest in collapsible
  const latestVersions = versions.slice(0, 2);
  const olderVersions = versions.slice(2);

  if (isLoading && isOpen) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="w-4 h-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="w-4 h-4" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Latest versions (always visible) */}
        {latestVersions.map((version: Version) => (
          <VersionItem
            key={version.id}
            version={version}
            onRestore={onRestore}
            onPreview={setSelectedVersion}
          />
        ))}

        {/* Older versions (collapsible) */}
        {olderVersions.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground"
              >
                <span>View {olderVersions.length} older version{olderVersions.length > 1 ? 's' : ''}</span>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {olderVersions.map((version: Version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  onRestore={onRestore}
                  onPreview={setSelectedVersion}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {versions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No version history available
          </p>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Version {selectedVersion?.version} Preview
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Created {new Date(selectedVersion?.createdAt || '').toLocaleString()} by {selectedVersion?.createdBy}
              </div>
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="whitespace-pre-wrap text-sm text-foreground">
                  {selectedVersion?.content}
                </div>
              </div>
              {selectedVersion?.changes && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Changes:</h4>
                  <p className="text-sm text-muted-foreground">{selectedVersion.changes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface VersionItemProps {
  version: Version;
  onRestore?: (version: Version) => void;
  onPreview: (version: Version) => void;
}

function VersionItem({ version, onRestore, onPreview }: VersionItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground">Version {version.version}</span>
          {version.isCurrent && (
            <Badge variant="default" className="text-xs">Current</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(version.createdAt).toLocaleString()} by {version.createdBy}
        </div>
        {version.changes && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {version.changes}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 ml-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPreview(version)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Eye className="w-3 h-3" />
        </Button>
        {!version.isCurrent && onRestore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRestore(version)}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}