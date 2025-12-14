# Bybit API Integration Guide

## Overview

The Eloity Platform now integrates Bybit API as an additional data source for cryptocurrency features. Bybit provides real-time market data, orderbook information, and account management capabilities.

## Integration Architecture

### Data Source Hierarchy

The platform uses a fallback system for cryptocurrency prices:

1. **CryptoAPIs** (Primary) - Used when `CRYPTOAPIS_API_KEY` is configured
2. **Bybit** (Secondary) - Used as fallback when CryptoAPIs is unavailable
3. **CoinGecko** (Tertiary) - Used as final fallback
4. **Hardcoded Prices** (Fallback) - Used when all external APIs fail

### Supported Trading Pairs

Bybit integration supports the following spot trading pairs:

- BTCUSDT - Bitcoin
- ETHUSDT - Ethereum
- USDTUSDT - Tether
- BNBUSDT - Binance Coin
- SOLUSDT - Solana
- ADAUSDT - Cardano
- LINKUSDT - Chainlink
- MATICUSDT - Polygon
- AVAXUSDT - Avalanche
- DOTUSDT - Polkadot
- DOGEUSDT - Dogecoin

## Environment Configuration

### Required Environment Variables

```env
# Bybit API Credentials (for authenticated requests)
BYBIT_PUBLIC_API=your_bybit_public_api_key
BYBIT_SECRET_API=your_bybit_secret_api_key

# Frontend Bybit API Key (public API calls only)
VITE_BYBIT_API_KEY=your_bybit_public_api_key
```

### Optional Environment Variables

```env
# Existing cryptocurrency sources (recommended to keep configured)
CRYPTOAPIS_API_KEY=your_cryptoapis_key
COINGECKO_API_KEY=your_coingecko_key
```

## Backend Service API

### Bybit Service (`server/services/bybitService.ts`)

The service provides the following functions:

#### Public API Methods (No Authentication Required)

```typescript
// Get server time
getBybitServerTime(): Promise<number | null>

// Get ticker data for a symbol
getBybitTicker(symbol: string, category?: 'spot' | 'linear' | 'inverse'): Promise<TickerData | null>

// Get order book (market depth)
getBybitOrderBook(symbol: string, limit?: number, category?: 'spot' | 'linear' | 'inverse'): Promise<OrderBook | null>

// Get kline (candlestick) data
getBybitKlines(symbol: string, interval?: string, limit?: number, category?: 'spot' | 'linear' | 'inverse'): Promise<Kline[] | null>

// Get supported instruments/symbols
getBybitInstruments(category?: 'spot' | 'linear' | 'inverse'): Promise<Instrument[]>

// Get leverage tokens list
getBybitLeverageTokens(): Promise<LeverageToken[]>

// Verify API connectivity
verifyBybitConnection(): Promise<boolean>
```

#### Authenticated API Methods (Requires Authentication)

```typescript
// Get wallet balance
getBybitWalletBalance(accountType?: 'SPOT' | 'UNIFIED'): Promise<WalletBalance[] | null>

// Get deposit address for a coin
getBybitDepositAddress(coin: string, chain?: string): Promise<DepositAddress | null>

// Get withdrawal fees
getBybitWithdrawalFee(coin: string, chain?: string): Promise<WithdrawalFee | null>

// Get trading fees for a symbol
getBybitTradingFees(symbol: string, category?: 'spot' | 'linear' | 'inverse'): Promise<TradingFees | null>
```

## REST API Endpoints

### Base URL
```
/api/bybit
```

### Public Endpoints

#### Health Check
```
GET /api/bybit/health
Response: { status: 'ok' | 'error', message: string }
```

#### Server Time
```
GET /api/bybit/server/time
Response: { timestamp: number, success: boolean }
```

#### Get Ticker
```
GET /api/bybit/market/ticker?symbol=BTCUSDT&category=spot
Response: {
  symbol: string,
  lastPrice: number,
  bidPrice: number,
  askPrice: number,
  highPrice24h: number,
  lowPrice24h: number,
  volume24h: number,
  turnover24h: number,
  price24hPcnt: number,
  timestamp: number
}
```

#### Get Order Book
```
GET /api/bybit/market/orderbook?symbol=BTCUSDT&limit=25&category=spot
Response: {
  symbol: string,
  bids: Array<{ price: number, quantity: number, total: number }>,
  asks: Array<{ price: number, quantity: number, total: number }>,
  timestamp: number
}
```

#### Get Klines
```
GET /api/bybit/market/klines?symbol=BTCUSDT&interval=1&limit=200&category=spot
Response: Array<{
  timestamp: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
  turnover: number
}>
```

#### Get Instruments
```
GET /api/bybit/market/instruments?category=spot
Response: {
  category: string,
  count: number,
  instruments: Array<Instrument>
}
```

#### Get Leverage Tokens
```
GET /api/bybit/spot-lever-token/list
Response: { count: number, tokens: Array<LeverageToken> }
```

### Authenticated Endpoints

All authenticated endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Get Wallet Balance
```
GET /api/bybit/account/wallet-balance?accountType=UNIFIED
Response: Array<{
  accountType: string,
  totalEquity: number,
  totalWalletBalance: number,
  coins: Array<CoinBalance>
}>
```

#### Get Deposit Address
```
GET /api/bybit/asset/deposit-address?coin=BTC&chain=BTC
Response: {
  coin: string,
  chains: Array<{
    chain: string,
    address: string,
    tag?: string,
    chainDeposit: string
  }>
}
```

#### Get Withdrawal Fee
```
GET /api/bybit/asset/withdrawal-fee?coin=BTC&chain=BTC
Response: {
  coin: string,
  withdrawFee: string,
  chains: Array<ChainFee>
}
```

#### Get Trading Fees
```
GET /api/bybit/account/trading-fees?symbol=BTCUSDT&category=spot
Response: {
  symbol: string,
  category: string,
  takerFeeRate: number,
  makerFeeRate: number
}
```

## Frontend Integration

### Using the Bybit Client

```typescript
import bybitClient from '@/lib/bybit-client';

// Fetch single ticker
const ticker = await bybitClient.getTicker('BTCUSDT', 'spot');

// Fetch multiple tickers
const tickers = await bybitClient.getMultipleTickers(['BTCUSDT', 'ETHUSDT']);

// Get order book
const orderbook = await bybitClient.getOrderBook('BTCUSDT', 25, 'spot');

// Get klines
const klines = await bybitClient.getKlines('BTCUSDT', '1', 200, 'spot');

// Get wallet balance (requires auth)
const balance = await bybitClient.getWalletBalance('UNIFIED');

// Subscribe to real-time updates
const unsubscribe = await bybitClient.subscribeTicker(
  'BTCUSDT',
  5000,
  (ticker) => console.log('Updated:', ticker),
  (error) => console.error('Error:', error)
);

// Cleanup
unsubscribe();
```

### React Hooks

#### useBybitPrice

Fetch and subscribe to real-time price updates:

```typescript
import { useBybitPrice } from '@/hooks/use-bybit';

function MyComponent() {
  const { price, loading, error } = useBybitPrice({
    symbol: 'BTCUSDT',
    interval: 5000,
    enabled: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>BTC Price: ${price?.price}</div>;
}
```

#### useBybitOrderbook

Fetch and update order book data:

```typescript
import { useBybitOrderbook } from '@/hooks/use-bybit';

function OrderbookComponent() {
  const { orderbook, loading, error, refetch } = useBybitOrderbook({
    symbol: 'BTCUSDT',
    limit: 25,
    interval: 5000,
    enabled: true
  });

  return (
    <div>
      {orderbook && (
        <>
          <div>Bids: {orderbook.bids.length}</div>
          <div>Asks: {orderbook.asks.length}</div>
        </>
      )}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

#### useBybitKlines

Fetch historical candlestick data:

```typescript
import { useBybitKlines } from '@/hooks/use-bybit';

function ChartComponent() {
  const { klines, loading, error } = useBybitKlines({
    symbol: 'BTCUSDT',
    interval: '60', // 1 hour
    limit: 100,
    enabled: true
  });

  return <div>{klines && <Chart data={klines} />}</div>;
}
```

#### useBybitWallet

Fetch wallet balance (authenticated):

```typescript
import { useBybitWallet } from '@/hooks/use-bybit';

function WalletComponent() {
  const { wallet, loading, error } = useBybitWallet({
    enabled: true
  });

  return (
    <div>
      {wallet && <div>Total Equity: ${wallet.totalEquity}</div>}
    </div>
  );
}
```

#### useBybitHealth

Check API health status:

```typescript
import { useBybitHealth } from '@/hooks/use-bybit';

function HealthCheck() {
  const { isHealthy } = useBybitHealth();

  return (
    <div>
      Status: {isHealthy ? '✅ Operational' : '❌ Down'}
    </div>
  );
}
```

### UI Component

Use the pre-built BybitPriceDisplay component:

```typescript
import { BybitPriceDisplay } from '@/components/crypto/BybitPriceDisplay';

function CryptoPage() {
  return (
    <BybitPriceDisplay
      symbol="BTCUSDT"
      showOrderbook={true}
      refreshInterval={5000}
      className="mb-6"
    />
  );
}
```

## Security Considerations

1. **API Keys**: Store Bybit API keys in environment variables, never in code
2. **Authenticated Endpoints**: Only accessible with valid JWT token
3. **Rate Limiting**: Implement rate limiting for API endpoints to prevent abuse
4. **HTTPS**: Always use HTTPS in production
5. **HMAC Signing**: Server-side signing prevents exposure of secret keys
6. **Request Timeout**: All requests have 10-second timeout to prevent hanging

## Error Handling

All Bybit service methods return `null` on error and log details. Example error handling:

```typescript
const ticker = await bybitClient.getTicker('BTCUSDT');
if (!ticker) {
  console.error('Failed to fetch ticker');
  // Use fallback or cached data
}
```

## Monitoring & Logging

The Bybit service logs all operations. Monitor logs for:

- API connectivity issues
- Rate limit errors (HTTP 429)
- Authentication failures
- Data validation errors

Example log:
```
[INFO] Bybit API connection verified
[INFO] Fetching Bybit data for bitcoin (pair: BTCUSDT)
[INFO] Successfully fetched Bybit data for bitcoin: $45000
```

## Troubleshooting

### "Bybit API keys not configured"
- Check `.env.local` contains `BYBIT_PUBLIC_API` and `BYBIT_SECRET_API`
- Verify keys are correct from Bybit dashboard

### "Failed to fetch data from Bybit"
- Check internet connectivity
- Verify Bybit API is operational (https://status.bybit.com)
- Check rate limits haven't been exceeded

### "Invalid signature" on authenticated requests
- Verify BYBIT_SECRET_API is correct
- Check server time synchronization
- Ensure HMAC-SHA256 signing is working

### "Timeout" errors
- May indicate network issues or Bybit server overload
- Data will fallback to CoinGecko automatically
- Check Bybit API status

## Performance Optimization

1. **Caching**: Implement caching for frequently requested symbols
2. **Batch Requests**: Use `getMultipleTickers()` for multiple prices
3. **Polling Intervals**: Default 5000ms, adjust based on use case
4. **Lazy Loading**: Load Bybit data only when component is visible

## Testing

Test script available: `scripts/testing/test-crypto-integration.js`

```bash
npm run test:crypto
```

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Advanced trading features (place orders, withdraw)
- [ ] Multi-account support
- [ ] Price alerts and notifications
- [ ] Historical data analysis tools
- [ ] Portfolio analytics

## Support

For issues or questions:
1. Check Bybit API documentation: https://bybit-exchange.github.io/docs
2. Review logs for error messages
3. Test endpoints using provided test script
4. Contact platform support

## References

- Bybit API Documentation: https://bybit-exchange.github.io/docs
- Bybit Status Page: https://status.bybit.com
- Trading Pairs: https://www.bybit.com/en/trade/spot

---

**Last Updated**: December 2024
**Version**: 1.0.0
