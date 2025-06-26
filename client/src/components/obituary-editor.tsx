import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GeneratedObituary {
  id: number;
  aiProvider: string;
  version: number;
  content: string;
  tone: string;
  isRevision: boolean;
}

interface ObituaryEditorProps {
  obituary: GeneratedObituary;
  onSave: (content: string) => void;
  onClose: () => void;
  onDownload: () => void;
}

export default function ObituaryEditor({ obituary, onSave, onClose, onDownload }: ObituaryEditorProps) {
  const [content, setContent] = useState(obituary.content);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const updateObituaryMutation = useMutation({
    mutationFn: async (newContent: string) => {
      return await apiRequest('PUT', `/api/generated-obituaries/${obituary.id}`, {
        content: newContent,
      });
    },
    onSuccess: () => {
      onSave(content);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Obituary updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update obituary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== obituary.content);
  };

  const handleSave = () => {
    if (hasChanges) {
      updateObituaryMutation.mutate(content);
    }
  };

  const handleReset = () => {
    setContent(obituary.content);
    setHasChanges(false);
  };

  const formatText = (action: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (!selectedText) return;

    let formattedText = '';
    switch (action) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'quote':
        formattedText = `"${selectedText}"`;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    handleContentChange(newContent);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const getWordCount = () => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = () => {
    return content.length;
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="text-primary hover:text-blue-700 mb-4"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Generated Obituaries
        </Button>
        <h2 className="text-2xl font-semibold text-foreground">Edit Obituary</h2>
        <p className="text-muted-foreground mt-1">
          {obituary.aiProvider.charAt(0).toUpperCase() + obituary.aiProvider.slice(1)} AI - 
          {obituary.isRevision ? ' Revised Version' : ` Version ${obituary.version}`} - {obituary.tone}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-foreground">Obituary Content</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => formatText('bold')}
                    title="Bold"
                  >
                    <i className="fas fa-bold"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => formatText('italic')}
                    title="Italic"
                  >
                    <i className="fas fa-italic"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => formatText('quote')}
                    title="Quote"
                  >
                    <i className="fas fa-quote-right"></i>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[500px] text-base leading-relaxed"
                placeholder="Edit the obituary content here..."
              />
              
              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <div className="flex space-x-4">
                  <span>{getWordCount()} words</span>
                  <span>{getCharacterCount()} characters</span>
                </div>
                {hasChanges && (
                  <span className="text-amber-600 flex items-center">
                    <i className="fas fa-circle text-xs mr-1"></i>
                    Unsaved changes
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleSave}
                disabled={!hasChanges || updateObituaryMutation.isPending}
                className="w-full bg-primary text-white hover:bg-blue-700"
              >
                {updateObituaryMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save Changes
                  </>
                )}
              </Button>

              <Button 
                onClick={handleReset}
                disabled={!hasChanges}
                variant="outline"
                className="w-full"
              >
                <i className="fas fa-undo mr-2"></i>
                Reset to Original
              </Button>

              <Button 
                onClick={onDownload}
                variant="outline"
                className="w-full"
              >
                <i className="fas fa-download mr-2"></i>
                Download PDF
              </Button>
            </CardContent>
          </Card>

          {/* Writing Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Writing Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="space-y-2">
                <p className="font-medium text-gray-800">Structure Guidelines:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Start with announcement of passing</li>
                  <li>Include key biographical information</li>
                  <li>Mention family members</li>
                  <li>Share personal qualities and achievements</li>
                  <li>End with service information or memorial requests</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-gray-800">Tone Considerations:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Use present tense for lasting qualities</li>
                  <li>Be specific with personal details</li>
                  <li>Focus on positive impact</li>
                  <li>Include meaningful relationships</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Version Info */}
          <Card>
            <CardHeader>
              <CardTitle>Version Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">AI Provider:</span>
                <span className="font-medium capitalize">{obituary.aiProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">
                  {obituary.isRevision ? 'Revised' : `${obituary.version}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tone:</span>
                <span className="font-medium">{obituary.tone}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
