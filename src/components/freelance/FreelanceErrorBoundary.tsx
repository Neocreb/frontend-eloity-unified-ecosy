import React, { ReactNode, Component, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Freelance Components
 * Catches errors in child components and displays user-friendly error UI
 */
export class FreelanceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Freelance component error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-red-200 dark:border-red-900 p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error message */}
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 text-center mb-2">
                Something Went Wrong
              </h2>

              <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-4">
                We encountered an error loading this page. Our team has been notified.
              </p>

              {/* Error details (development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                  <p className="text-xs font-mono text-red-700 dark:text-red-400 break-words">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = '/freelance')}
                  variant="ghost"
                  className="w-full gap-2"
                >
                  <Home className="w-4 h-4" />
                  Back to Freelance
                </Button>
              </div>

              {/* Support link */}
              <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center mt-4">
                Need help? <a href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline error message component
 * Use for non-critical errors that don't require full page fallback
 */
interface ErrorMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const FreelanceErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onDismiss,
  onRetry,
}) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-4">
    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="font-medium text-red-900 dark:text-red-200">{title}</h4>
      <p className="text-sm text-red-800 dark:text-red-300 mt-1">{message}</p>
    </div>
    <div className="flex gap-2 flex-shrink-0">
      {onRetry && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRetry}
          className="h-8"
        >
          Retry
        </Button>
      )}
      {onDismiss && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="h-8"
        >
          Dismiss
        </Button>
      )}
    </div>
  </div>
);

/**
 * Success message component
 * For displaying successful operations
 */
interface SuccessMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export const FreelanceSuccessMessage: React.FC<SuccessMessageProps> = ({
  title = 'Success',
  message,
  onDismiss,
  autoClose = true,
  autoCloseDuration = 3000,
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, onDismiss]);

  if (!visible) return null;

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-4">
      <div className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5">
        <svg
          className="w-full h-full"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-green-900 dark:text-green-200">{title}</h4>
        <p className="text-sm text-green-800 dark:text-green-300 mt-1">{message}</p>
      </div>
      {onDismiss && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="h-8"
        >
          Dismiss
        </Button>
      )}
    </div>
  );
};

/**
 * Loading state with fallback message
 * Use when data is loading
 */
interface LoadingMessageProps {
  message?: string;
}

export const FreelanceLoadingMessage: React.FC<LoadingMessageProps> = ({
  message = 'Loading...',
}) => (
  <div className="flex items-center justify-center py-8">
    <div className="flex gap-3 items-center">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse" />
        <div className="absolute inset-1 bg-white dark:bg-neutral-900 rounded-full" />
      </div>
      <span className="text-neutral-600 dark:text-neutral-400 text-sm">{message}</span>
    </div>
  </div>
);

export default FreelanceErrorBoundary;
