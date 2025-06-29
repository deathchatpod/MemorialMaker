import React, { useState, useEffect } from 'react';
import { AlertCircle, Save, Clock, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { Badge } from './badge';
import { useAutoSave } from '@/hooks/useAutoSave';
import { cn } from '@/lib/utils';
import LoadingSpinner from './loading-spinner';

interface FormWrapperProps {
  children: React.ReactNode;
  onSave: (data: any) => Promise<void>;
  formData: any;
  autoSaveEnabled?: boolean;
  showSaveStatus?: boolean;
  title?: string;
  description?: string;
  errors?: Record<string, string>;
  className?: string;
}

export function FormWrapper({
  children,
  onSave,
  formData,
  autoSaveEnabled = true,
  showSaveStatus = true,
  title,
  description,
  errors = {},
  className
}: FormWrapperProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { saveNow, isSaving } = useAutoSave(formData, {
    onSave: async (data) => {
      setSaveStatus('saving');
      try {
        await onSave(data);
        setLastSaved(new Date());
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 5000);
        throw error;
      }
    },
    enabled: autoSaveEnabled,
    interval: 30000, // 30 seconds
    key: `form-${title || 'default'}`
  });

  const handleManualSave = async () => {
    try {
      await saveNow();
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  };

  const errorCount = Object.keys(errors).length;
  const hasUnsavedChanges = saveStatus === 'idle' && lastSaved && 
    Date.now() - lastSaved.getTime() > 60000; // Consider unsaved after 1 minute

  return (
    <div className={cn("space-y-6", className)}>
      {/* Form Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              {showSaveStatus && (
                <div className="flex items-center gap-3">
                  {/* Save Status Indicator */}
                  {saveStatus === 'saving' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <LoadingSpinner size="sm" />
                      Saving...
                    </Badge>
                  )}
                  {saveStatus === 'saved' && (
                    <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Saved
                    </Badge>
                  )}
                  {saveStatus === 'error' && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Save Failed
                    </Badge>
                  )}
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Unsaved Changes
                    </Badge>
                  )}

                  {/* Manual Save Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSave}
                    disabled={isSaving || saveStatus === 'saving'}
                    className="flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save Now
                  </Button>
                </div>
              )}
            </div>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Auto-save Status */}
      {autoSaveEnabled && showSaveStatus && lastSaved && (
        <div className="text-sm text-muted-foreground">
          Last saved: {lastSaved.toLocaleTimeString()}
          {autoSaveEnabled && ' • Auto-save enabled'}
        </div>
      )}

      {/* Error Summary */}
      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix {errorCount} error{errorCount > 1 ? 's' : ''} before continuing:
            <ul className="mt-2 list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="text-sm">
                  <strong>{field}:</strong> {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Save Status Footer */}
      {showSaveStatus && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {autoSaveEnabled ? (
              <>Changes are automatically saved every 30 seconds</>
            ) : (
              <>Remember to save your changes manually</>
            )}
          </div>
          
          {saveStatus === 'error' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              className="text-destructive hover:text-destructive"
            >
              Retry Save
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default FormWrapper;