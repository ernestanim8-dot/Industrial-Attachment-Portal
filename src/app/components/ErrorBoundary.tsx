import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              We're sorry for the inconvenience. An unexpected error has occurred.
            </p>
            {this.state.error && (
              <div className="bg-muted rounded p-3 mb-4 text-left">
                <p className="text-sm text-foreground font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset}>Try Again</Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
