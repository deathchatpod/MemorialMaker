import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(error);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      return; // Max retries reached
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Reset retry count after 30 seconds
    this.retryTimeoutId = setTimeout(() => {
      this.setState({ retryCount: 0 });
    }, 30000);
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const canRetry = this.state.retryCount < 3;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                We encountered an unexpected error. This has been logged and we'll work to fix it.
              </p>

              {error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Error details
                  </summary>
                  <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all">
                    <div className="font-semibold">{error.name}</div>
                    <div className="mt-1">{error.message}</div>
                    {error.stack && (
                      <div className="mt-2 text-xs opacity-70">
                        {error.stack.split('\n').slice(0, 5).join('\n')}
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again {this.state.retryCount > 0 && `(${this.state.retryCount}/3)`}
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>

                {!canRetry && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Maximum retry attempts reached. Please refresh the page or contact support.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ErrorBoundary;