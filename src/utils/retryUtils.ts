// Utility for retrying failed operations with exponential backoff

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 300,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = defaultOptions.maxAttempts,
    initialDelayMs = defaultOptions.initialDelayMs,
    maxDelayMs = defaultOptions.maxDelayMs,
    backoffMultiplier = defaultOptions.backoffMultiplier,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: any;
  let delayMs = initialDelayMs;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      // Wait before retrying
      console.warn(
        `Attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`,
        error instanceof Error ? error.message : String(error),
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Increase delay for next attempt
      delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

// Determine if an error is retryable
function defaultShouldRetry(error: any): boolean {
  if (!error) return false;

  // Retry on network errors
  const message = error.message || '';
  const name = error.name || '';

  // Failed to fetch usually means network error
  if (message.includes('Failed to fetch')) {
    return true;
  }

  // Retryable fetch errors
  if (name === 'AuthRetryableFetchError') {
    return true;
  }

  // Network timeouts
  if (message.includes('timeout') || message.includes('TIMEOUT')) {
    return true;
  }

  // Connection refused or similar network errors
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT')
  ) {
    return true;
  }

  // Retry on 5xx server errors
  if (error.status && error.status >= 500 && error.status < 600) {
    return true;
  }

  // Retry on rate limit errors
  if (error.status === 429) {
    return true;
  }

  return false;
}
