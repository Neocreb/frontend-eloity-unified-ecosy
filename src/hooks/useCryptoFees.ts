import { useState, useEffect, useCallback } from 'react';

export interface FeeData {
  network: string;
  gasPrice: number;
  gasLimit: number;
  totalFee: number;
  estimatedTime: string;
  priority: 'low' | 'standard' | 'high';
  timestamp: string;
}

export interface UseCryptoFeesReturn {
  fees: FeeData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCryptoFees(
  blockchain: string = 'ethereum',
  network: string = 'mainnet'
): UseCryptoFeesReturn {
  const [fees, setFees] = useState<FeeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Return static fee estimates since blockchain data is not critical for frontend
      // In production, you could fetch from Bybit or another provider
      const estimatedFees: FeeData[] = [
        {
          network,
          gasPrice: 20,
          gasLimit: 21000,
          totalFee: 0.00042,
          estimatedTime: '1-2 minutes',
          priority: 'low',
          timestamp: new Date().toISOString(),
        },
        {
          network,
          gasPrice: 30,
          gasLimit: 21000,
          totalFee: 0.00063,
          estimatedTime: '10-30 seconds',
          priority: 'standard',
          timestamp: new Date().toISOString(),
        },
        {
          network,
          gasPrice: 50,
          gasLimit: 21000,
          totalFee: 0.00105,
          estimatedTime: '1-10 seconds',
          priority: 'high',
          timestamp: new Date().toISOString(),
        },
      ];

      setFees(estimatedFees);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching fees:', errorMessage);
      setError(errorMessage);
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, [blockchain, network]);

  useEffect(() => {
    fetchFees();

    // Refresh every 30 seconds
    const interval = setInterval(fetchFees, 30000);

    return () => clearInterval(interval);
  }, [fetchFees]);

  return {
    fees,
    loading,
    error,
    refetch: fetchFees,
  };
}
