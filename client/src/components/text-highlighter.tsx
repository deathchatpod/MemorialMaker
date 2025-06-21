import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TextSelection {
  selectedText: string;
  feedbackType: 'liked' | 'disliked';
}

interface TextHighlighterProps {
  content: string;
  onTextSelect: (text: string, type: 'liked' | 'disliked') => void;
  selectedTexts: TextSelection[];
}

export default function TextHighlighter({ content, onTextSelect, selectedTexts }: TextHighlighterProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Create a map of selected texts for quick lookup
  const selectedTextMap = selectedTexts.reduce((acc, item) => {
    acc[item.selectedText] = item.feedbackType;
    return acc;
  }, {} as Record<string, 'liked' | 'disliked'>);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();

    if (text.length > 0 && contentRef.current?.contains(range.commonAncestorContainer)) {
      setSelectedText(text);
      setSelectionRange(range.cloneRange());
      setShowModal(true);
    }
  };

  const handleFeedback = (type: 'liked' | 'disliked') => {
    if (selectedText && selectionRange) {
      onTextSelect(selectedText, type);
      highlightText(selectionRange, type);
      clearSelection();
    }
  };

  const highlightText = (range: Range, type: 'liked' | 'disliked') => {
    const span = document.createElement('span');
    span.className = type === 'liked' 
      ? 'bg-green-100 text-green-800 rounded px-1' 
      : 'bg-red-100 text-red-800 rounded px-1';
    span.setAttribute('data-feedback', type);
    span.setAttribute('data-original-text', range.toString());

    try {
      range.surroundContents(span);
    } catch (error) {
      // If surroundContents fails (due to range spanning multiple elements),
      // extract and wrap the content
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
  };

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectionRange(null);
    setShowModal(false);
  };

  const highlightExistingText = () => {
    if (!contentRef.current) return;

    selectedTexts.forEach((item) => {
      highlightAllOccurrences(item.selectedText, item.feedbackType);
    });
  };

  const highlightAllOccurrences = (searchText: string, feedbackType: 'liked' | 'disliked') => {
    if (!contentRef.current || !searchText.trim()) return;

    const className = feedbackType === 'liked' 
      ? 'bg-green-100 text-green-800 rounded px-1' 
      : 'bg-red-100 text-red-800 rounded px-1';

    // Use a more robust text search and replace approach
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      // Skip nodes that are already highlighted
      const parent = node.parentNode as Element;
      if (parent && parent.getAttribute && parent.getAttribute('data-feedback')) {
        continue;
      }
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      const nodeText = textNode.textContent || '';
      const searchIndex = nodeText.toLowerCase().indexOf(searchText.toLowerCase());
      
      if (searchIndex !== -1) {
        const beforeText = nodeText.substring(0, searchIndex);
        const matchedText = nodeText.substring(searchIndex, searchIndex + searchText.length);
        const afterText = nodeText.substring(searchIndex + searchText.length);

        const fragment = document.createDocumentFragment();
        
        if (beforeText) {
          fragment.appendChild(document.createTextNode(beforeText));
        }

        const span = document.createElement('span');
        span.className = className;
        span.setAttribute('data-feedback', feedbackType);
        span.setAttribute('data-original-text', searchText);
        span.textContent = matchedText;
        fragment.appendChild(span);

        if (afterText) {
          fragment.appendChild(document.createTextNode(afterText));
        }

        const parent = textNode.parentNode;
        if (parent) {
          parent.replaceChild(fragment, textNode);
        }
      }
    });
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  useEffect(() => {
    // Apply highlights after markdown is rendered
    const timer = setTimeout(() => {
      // Clear existing highlights first
      if (contentRef.current) {
        const existingHighlights = contentRef.current.querySelectorAll('span[data-feedback]');
        existingHighlights.forEach(span => {
          const parent = span.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(span.textContent || ''), span);
            parent.normalize();
          }
        });
      }
      highlightExistingText();
    }, 150);
    return () => clearTimeout(timer);
  }, [content, selectedTexts]);

  return (
    <>
      <div 
        ref={contentRef}
        className="text-sm text-gray-700 leading-relaxed cursor-text select-text markdown-content"
        onMouseUp={handleMouseUp}
        style={{ userSelect: 'text' }}
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Customize paragraph styling
            p: ({ children }) => <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>,
            // Style headings
            h1: ({ children }) => <h1 className="text-lg font-semibold text-gray-900 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-semibold text-gray-900 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-900 mb-1">{children}</h3>,
            // Style emphasis
            em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            // Style lists
            ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-gray-700">{children}</li>,
            // Style blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Selected Text</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700 font-medium">Selected text:</p>
              <p className="text-sm text-gray-600 mt-1 italic">"{selectedText}"</p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">How do you feel about this text?</p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleFeedback('liked')}
                  className="flex-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  variant="outline"
                >
                  <i className="fas fa-thumbs-up mr-2"></i>
                  I like this
                </Button>
                <Button
                  onClick={() => handleFeedback('disliked')}
                  className="flex-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  variant="outline"
                >
                  <i className="fas fa-thumbs-down mr-2"></i>
                  Want to change
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={clearSelection}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
