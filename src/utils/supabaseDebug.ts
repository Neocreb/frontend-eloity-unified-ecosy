// Utility to debug Supabase connection issues
export async function debugSupabaseConnection(): Promise<{
  isConnected: boolean;
  url: string;
  hasKey: boolean;
  error?: string;
}> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.log('Supabase Debug Info:');
  console.log('URL:', url);
  console.log('Has Key:', !!key);

  if (!url || !key) {
    return {
      isConnected: false,
      url: url || '',
      hasKey: !!key,
      error: 'Missing Supabase URL or key',
    };
  }

  try {
    // Test if we can reach the Supabase server
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'apikey': key,
      },
    });

    console.log('Supabase Health Check Response:', response.status);

    if (response.ok || response.status === 401 || response.status === 403) {
      // 401/403 are expected if the endpoint requires auth, but it means server is reachable
      return {
        isConnected: true,
        url,
        hasKey: !!key,
      };
    }

    return {
      isConnected: false,
      url,
      hasKey: !!key,
      error: `Server returned status ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Supabase Connection Error:', errorMessage);
    
    return {
      isConnected: false,
      url,
      hasKey: !!key,
      error: errorMessage,
    };
  }
}

// Enhanced error handler for Supabase errors
export function parseSupabaseError(error: any): string {
  if (!error) return 'Unknown error';

  // Handle different error types
  if (error.message === 'Failed to fetch') {
    // This could be CORS, network issue, or invalid URL
    return 'Network connection failed. Please check your internet connection and ensure Supabase is accessible.';
  }

  if (error.name === 'AuthRetryableFetchError') {
    return 'Failed to connect to authentication service. This might be a temporary network issue.';
  }

  if (error.status === 401 || error.status === 403) {
    return 'Authentication failed. Invalid credentials or insufficient permissions.';
  }

  if (error.message === 'Invalid login credentials') {
    return 'Invalid email or password. Please check your credentials.';
  }

  if (error.message === 'User already registered') {
    return 'An account with this email already exists.';
  }

  return error.message || 'An error occurred';
}
