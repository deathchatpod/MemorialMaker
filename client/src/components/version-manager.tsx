import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, History, Star } from 'lucide-react';
import { format } from 'date-fns';

interface GeneratedObituary {
  id: number;
  aiProvider: string;
  version: number;
  content: string;
  isRevision: boolean;
  createdAt: string;
}

interface TextFeedback {
  id: number;
  selectedText: string;
  feedbackType: 'liked' | 'disliked';
  collaboratorName?: string;
  collaboratorEmail?: string;
}

interface VersionManagerProps {
  obituaries: GeneratedObituary[];
  feedback: { [key: number]: TextFeedback[] };
  onSelectText: (obituaryId: number, text: string, type: 'liked' | 'disliked') => void;
  isCollaborator?: boolean;
}

export default function VersionManager({ 
  obituaries, 
  feedback, 
  onSelectText, 
  isCollaborator = false 
}: VersionManagerProps) {
  const [showHistory, setShowHistory] = useState(false);

  // Separate current and historical versions
  const claudeObituaries = obituaries
    .filter(o => o.aiProvider === 'claude')
    .sort((a, b) => b.version - a.version);
  
  const chatgptObituaries = obituaries
    .filter(o => o.aiProvider === 'chatgpt')
    .sort((a, b) => b.version - a.version);

  const currentClaude = claudeObituaries[0];
  const currentChatGPT = chatgptObituaries[0];
  const historicalClaude = claudeObituaries.slice(1);
  const historicalChatGPT = chatgptObituaries.slice(1);

  const renderObituaryContent = (obituary: GeneratedObituary, isHistorical = false) => {
    const obituaryFeedback = feedback[obituary.id] || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={obituary.aiProvider === 'claude' ? 'default' : 'secondary'}>
              {obituary.aiProvider === 'claude' ? 'Claude' : 'ChatGPT'} v{obituary.version}
            </Badge>
            {obituary.isRevision && (
              <Badge variant="outline">Revision</Badge>
            )}
            {!isHistorical && (
              <Star className="w-4 h-4 text-orange-500" />
            )}
          </div>
          <span className="text-sm text-gray-500">
            {format(new Date(obituary.createdAt), 'MMM d, yyyy h:mm a')}
          </span>
        </div>

        <div 
          className={`prose max-w-none p-4 border rounded-lg ${
            isHistorical ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
          }`}
        >
          <div
            className={`whitespace-pre-wrap ${isHistorical ? 'text-gray-600' : ''}`}
            onMouseUp={() => {
              if (isHistorical) return; // Can't edit historical versions
              
              const selection = window.getSelection();
              if (selection && selection.toString().length > 0) {
                const selectedText = selection.toString();
                // Show feedback options
                const feedbackType = confirm('Do you like this text?\nOK = Like, Cancel = Dislike') 
                  ? 'liked' : 'disliked';
                onSelectText(obituary.id, selectedText, feedbackType);
                selection.removeAllRanges();
              }
            }}
          >
            {obituary.content}
          </div>
        </div>

        {/* Show feedback for this version */}
        {obituaryFeedback.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Feedback</h4>
            {obituaryFeedback.map((fb) => (
              <div
                key={fb.id}
                className={`p-2 rounded text-sm ${
                  fb.feedbackType === 'liked' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                } border`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    fb.feedbackType === 'liked' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {fb.feedbackType === 'liked' ? '👍 Liked' : '👎 Disliked'}
                  </span>
                  {fb.collaboratorName && (
                    <span className="text-gray-600 text-xs">
                      by {fb.collaboratorName}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-gray-700">"{fb.selectedText}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Versions */}
      <Card>
        <CardHeader>
          <CardTitle>Current Versions</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isCollaborator 
              ? "Review and provide feedback by selecting text you like or want changed"
              : "Latest versions from each AI provider - compare and choose your preferred content"
            }
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="claude" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="claude" className="flex items-center gap-2">
                Claude {currentClaude && `v${currentClaude.version}`}
              </TabsTrigger>
              <TabsTrigger value="chatgpt" className="flex items-center gap-2">
                ChatGPT {currentChatGPT && `v${currentChatGPT.version}`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="claude" className="mt-6">
              {currentClaude ? (
                renderObituaryContent(currentClaude)
              ) : (
                <p className="text-center text-gray-500 py-8">No Claude version available</p>
              )}
            </TabsContent>
            
            <TabsContent value="chatgpt" className="mt-6">
              {currentChatGPT ? (
                renderObituaryContent(currentChatGPT)
              ) : (
                <p className="text-center text-gray-500 py-8">No ChatGPT version available</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Version History */}
      {(historicalClaude.length > 0 || historicalChatGPT.length > 0) && (
        <Card>
          <CardHeader>
            <Collapsible open={showHistory} onOpenChange={setShowHistory}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    <span>Version History</span>
                    <Badge variant="outline">
                      {historicalClaude.length + historicalChatGPT.length} versions
                    </Badge>
                  </div>
                  {showHistory ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Previous versions with feedback - read-only for reference
                </p>
                
                <Tabs defaultValue="claude-history" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="claude-history">
                      Claude History ({historicalClaude.length})
                    </TabsTrigger>
                    <TabsTrigger value="chatgpt-history">
                      ChatGPT History ({historicalChatGPT.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="claude-history" className="space-y-4 mt-6">
                    {historicalClaude.length > 0 ? (
                      historicalClaude.map((obituary) => (
                        <div key={obituary.id}>
                          {renderObituaryContent(obituary, true)}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No Claude history</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="chatgpt-history" className="space-y-4 mt-6">
                    {historicalChatGPT.length > 0 ? (
                      historicalChatGPT.map((obituary) => (
                        <div key={obituary.id}>
                          {renderObituaryContent(obituary, true)}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No ChatGPT history</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}