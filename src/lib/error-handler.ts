// Global error handler for fetch-related errors
export class FetchAbortError extends Error {
  constructor(message = "Request was aborted") {
    super(message);
    this.name = "FetchAbortError";
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.name === "FetchAbortError" ||
      error.message.includes("aborted") ||
      error.message.includes("cancelled"))
  );
}

export function handleFetchError(error: unknown): Error | null {
  // Don't show abort errors to the user
  if (isAbortError(error)) {
    console.debug("Request was aborted (this is normal behavior)");
    return null;
  }

  // Return other errors for handling
  return error instanceof Error ? error : new Error(String(error));
}

// Global handler for unhandled promise rejections
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    // Prevent abort errors from being shown as unhandled rejections
    if (isAbortError(event.reason)) {
      event.preventDefault();
      console.debug("Prevented abort error from becoming unhandled rejection");
    }
  });

  // Handle regular errors
  window.addEventListener("error", (event) => {
    if (isAbortError(event.error)) {
      event.preventDefault();
      console.debug("Prevented abort error from becoming unhandled error");
    }
  });
}

// Wrapper for async functions that handles abort errors
export function withAbortHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handledError = handleFetchError(error);
      if (handledError) {
        throw handledError;
      }
      // Silently ignore abort errors
      return undefined;
    }
  }) as T;
}

// Utility function to format errors for logging
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    // Handle Supabase errors
    if ('message' in error) {
      return (error as any).message;
    }
    // Handle other object errors
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}
