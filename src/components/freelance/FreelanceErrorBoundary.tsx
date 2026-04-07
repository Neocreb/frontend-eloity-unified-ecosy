import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface FreelanceErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface FreelanceErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary component for freelance features
 * Catches rendering errors and displays a helpful error message
 */
export class FreelanceErrorBoundary extends React.Component<
  FreelanceErrorBoundaryProps,
  FreelanceErrorBoundaryState
> {
  constructor(props: FreelanceErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FreelanceErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Freelance Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Something Went Wrong
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    We encountered an error while loading the freelance feature. 
                    Please try again or contact support if the problem persists.
                  </p>
                </div>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="w-full bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-left max-h-40 overflow-auto">
                    <p className="text-xs font-mono text-red-700 dark:text-red-300 break-words">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  <Button
                    onClick={this.handleReset}
                    className="flex-1"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/app/freelance"}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for managing freelance async errors
 */
export const useFreelanceError = () => {
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAsync = React.useCallback(
    async <T,>(
      operation: () => Promise<T>,
      errorMessage?: string
    ): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);
        return await operation();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(errorMessage || "An error occurred");
        setError(error);
        console.error("Freelance operation error:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = React.useCallback(() => setError(null), []);

  return { error, isLoading, handleAsync, clearError };
};

/**
 * Component for displaying error messages inline
 */
interface ErrorAlertProps {
  error: Error | null;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const FreelanceErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  action,
}) => {
  if (!error) return null;

  return (
    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
              Error
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              {error.message}
            </p>
            <div className="flex gap-2">
              {action && (
                <Button
                  onClick={action.onClick}
                  size="sm"
                  variant="outline"
                  className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  {action.label}
                </Button>
              )}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-red-700 dark:text-red-300"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Component for displaying connection/loading errors
 */
interface ConnectionErrorProps {
  isConnecting?: boolean;
  onRetry?: () => void;
}

export const FreelanceConnectionError: React.FC<ConnectionErrorProps> = ({
  isConnecting = false,
  onRetry,
}) => {
  return (
    <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              {isConnecting ? "Connecting..." : "Connection error. Please check your internet connection."}
            </p>
          </div>
          {onRetry && !isConnecting && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="ghost"
              className="text-yellow-700 dark:text-yellow-300"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FreelanceErrorBoundary;
