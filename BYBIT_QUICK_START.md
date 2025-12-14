# Bybit Integration - Quick Start Guide

## 5-Minute Setup

### 1. Verify Environment Variables
Your Bybit API keys are already configured:
```env
BYBIT_PUBLIC_API=JcVbtn7dMPaP3VpCa7
BYBIT_SECRET_API=8sYpzVombBAIlHS47S16POK3oNGQo3vx9sUz
VITE_BYBIT_API_KEY=JcVbtn7dMPaP3VpCa7
```

✅ No additional setup needed - keys are already in place!

### 2. Start the Server
```bash
npm run dev
```

Server will start with Bybit routes available at `/api/bybit`

### 3. Test the Integration
```bash
# Check if Bybit is working
curl http://localhost:5000/api/bybit/health

# Get BTC price
curl http://localhost:5000/api/bybit/market/ticker?symbol=BTCUSDT

# Get order book
curl http://localhost:5000/api/bybit/market/orderbook?symbol=BTCUSDT&limit=10
```

---

## Use in React Component

### Option 1: Use Pre-built Component (Easiest)

```typescript
import { BybitPriceDisplay } from '@/components/crypto/BybitPriceDisplay';

export function CryptoPage() {
  return (
    <BybitPriceDisplay
      symbol="BTCUSDT"
      showOrderbook={true}
      refreshInterval={5000}
    />
  );
}
```

### Option 2: Use React Hook

```typescript
import { useBybitPrice } from '@/hooks/use-bybit';

export function PriceWidget() {
  const { price, loading, error } = useBybitPrice({
    symbol: 'BTCUSDT',
    interval: 5000
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Bitcoin Price</h3>
      <p>${price?.price.toFixed(2)}</p>
      <p className={price?.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
        {price?.change24h.toFixed(2)}%
      </p>
    </div>
  );
}
```

### Option 3: Use Client Library Directly

```typescript
import bybitClient from '@/lib/bybit-client';
import { useEffect, useState } from 'react';

export function CustomPrice() {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    bybitClient.getTicker('BTCUSDT').then(setPrice);
  }, []);

  return price ? <div>${price.lastPrice}</div> : <div>Loading...</div>;
}
```

---

## Available Hooks

### useBybitPrice
Real-time price updates
```typescript
const { price, loading, error } = useBybitPrice({
  symbol: 'BTCUSDT',
  interval: 5000,
  enabled: true
});
```

### useBybitOrderbook
Order book depth
```typescript
const { orderbook, loading, error, refetch } = useBybitOrderbook({
  symbol: 'BTCUSDT',
  limit: 25
});
```

### useBybitKlines
Historical candlestick data
```typescript
const { klines, loading, error } = useBybitKlines({
  symbol: 'BTCUSDT',
  interval: '60', // 1 hour
  limit: 100
});
```

### useBybitWallet
Account balance (requires authentication)
```typescript
const { wallet, loading, error } = useBybitWallet({
  enabled: isLoggedIn
});
```

### useBybitHealth
API health status
```typescript
const { isHealthy } = useBybitHealth();
```

---

## API Reference

### Public Endpoints (No Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bybit/health` | GET | Check if Bybit API is working |
| `/api/bybit/server/time` | GET | Get Bybit server time |
| `/api/bybit/market/ticker` | GET | Get ticker for symbol |
| `/api/bybit/market/orderbook` | GET | Get order book depth |
| `/api/bybit/market/klines` | GET | Get candlestick data |
| `/api/bybit/market/instruments` | GET | List all trading pairs |
| `/api/bybit/spot-lever-token/list` | GET | List leverage tokens |

**Example**:
```typescript
// Get BTC ticker
const response = await fetch('/api/bybit/market/ticker?symbol=BTCUSDT');
const ticker = await response.json();
console.log(ticker.lastPrice); // 45000
```

### Authenticated Endpoints (Require JWT)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bybit/account/wallet-balance` | GET | Get account balance |
| `/api/bybit/asset/deposit-address` | GET | Get deposit address |
| `/api/bybit/asset/withdrawal-fee` | GET | Get withdrawal fee |
| `/api/bybit/account/trading-fees` | GET | Get trading fees |

**Example**:
```typescript
// Get wallet balance (requires auth token)
const response = await fetch('/api/bybit/account/wallet-balance', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Trading Pairs Available

```typescript
// All supported USDT pairs:
'BTCUSDT'   // Bitcoin
'ETHUSDT'   // Ethereum
'BNBUSDT'   // Binance Coin
'SOLUSDT'   // Solana
'ADAUSDT'   // Cardano
'LINKUSDT'  // Chainlink
'MATICUSDT' // Polygon
'AVAXUSDT'  // Avalanche
'DOTUSDT'   // Polkadot
'DOGEUSDT'  // Dogecoin
```

---

## Common Use Cases

### 1. Display Current Price

```typescript
function PriceCard() {
  const { price, loading } = useBybitPrice({ symbol: 'BTCUSDT' });

  return (
    <div className="p-4 bg-white rounded">
      <p className="text-gray-600">Bitcoin</p>
      <p className="text-2xl font-bold">
        {loading ? '...' : `$${price?.price.toLocaleString()}`}
      </p>
    </div>
  );
}
```

### 2. Show 24h Change Percentage

```typescript
function PriceChange() {
  const { price } = useBybitPrice({ symbol: 'ETHUSDT' });
  const isUp = price?.change24h >= 0;

  return (
    <span className={isUp ? 'text-green-600' : 'text-red-600'}>
      {isUp ? '+' : ''}{price?.change24h.toFixed(2)}%
    </span>
  );
}
```

### 3. Simple Price Table

```typescript
function PriceTable() {
  const pairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  const [prices, setPrices] = useState({});

  useEffect(() => {
    Promise.all(
      pairs.map(symbol =>
        bybitClient.getTicker(symbol).then(t => ({
          symbol,
          price: t?.lastPrice
        }))
      )
    ).then(results => {
      const priceMap = {};
      results.forEach(r => { priceMap[r.symbol] = r.price; });
      setPrices(priceMap);
    });
  }, []);

  return (
    <table>
      <thead><tr><th>Symbol</th><th>Price</th></tr></thead>
      <tbody>
        {pairs.map(pair => (
          <tr key={pair}>
            <td>{pair}</td>
            <td>${prices[pair]?.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 4. Order Book Visualization

```typescript
function OrderBook() {
  const { orderbook } = useBybitOrderbook({ symbol: 'BTCUSDT' });

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>Buy Orders (Bids)</h3>
        {orderbook?.bids.map((bid, i) => (
          <div key={i} className="flex justify-between">
            <span>${bid.price}</span>
            <span>{bid.quantity}</span>
          </div>
        ))}
      </div>
      <div>
        <h3>Sell Orders (Asks)</h3>
        {orderbook?.asks.map((ask, i) => (
          <div key={i} className="flex justify-between">
            <span>${ask.price}</span>
            <span>{ask.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:5000/api/bybit/health

# Get BTC price
curl "http://localhost:5000/api/bybit/market/ticker?symbol=BTCUSDT"

# Get ETH order book
curl "http://localhost:5000/api/bybit/market/orderbook?symbol=ETHUSDT&limit=5"

# List instruments
curl http://localhost:5000/api/bybit/market/instruments

# Get 1-hour candles
curl "http://localhost:5000/api/bybit/market/klines?symbol=BTCUSDT&interval=60&limit=24"
```

### Test with JavaScript

```javascript
// In browser console
fetch('/api/bybit/market/ticker?symbol=BTCUSDT')
  .then(r => r.json())
  .then(data => console.log('BTC Price:', data.lastPrice))
```

---

## Troubleshooting

### "Cannot find module" Error
**Solution**: Ensure you're importing from correct path:
```typescript
// ✅ Correct
import bybitClient from '@/lib/bybit-client';
import { useBybitPrice } from '@/hooks/use-bybit';

// ❌ Wrong
import bybitClient from '../lib/bybit-client';
```

### "404 Not Found" on API Endpoint
**Solution**: Check endpoint path:
```typescript
// ✅ Correct
fetch('/api/bybit/market/ticker?symbol=BTCUSDT')

// ❌ Wrong
fetch('/bybit/market/ticker?symbol=BTCUSDT')
```

### Data not updating
**Solution**: Check hooks are enabled:
```typescript
const { price } = useBybitPrice({
  symbol: 'BTCUSDT',
  enabled: true  // Make sure enabled is true
});
```

### Authentication errors on wallet endpoints
**Solution**: Ensure JWT token is passed:
```typescript
fetch('/api/bybit/account/wallet-balance', {
  headers: {
    'Authorization': `Bearer ${yourAuthToken}`
  }
})
```

---

## Performance Tips

1. **Reduce Update Frequency** for less important data:
   ```typescript
   useBybitPrice({ interval: 10000 }) // 10 seconds instead of 5
   ```

2. **Use Multiple Tickers** efficiently:
   ```typescript
   const tickers = await bybitClient.getMultipleTickers(['BTCUSDT', 'ETHUSDT']);
   ```

3. **Cache Data** in parent component:
   ```typescript
   const [prices, setPrices] = useState({});
   // Share across multiple components
   ```

4. **Lazy Load** components:
   ```typescript
   const BybitComponent = React.lazy(() => 
     import('@/components/crypto/BybitPriceDisplay')
   );
   ```

---

## Next Steps

1. **Add to your crypto pages** - Use BybitPriceDisplay component
2. **Create price alerts** - Use useBybitPrice hook with custom logic
3. **Build watchlists** - Save favorite symbols and track them
4. **Integrate with charts** - Use klines data with charting library
5. **Add to dashboards** - Display multiple price cards

---

## Need Help?

- 📖 Full Guide: See `BYBIT_INTEGRATION_GUIDE.md`
- 📋 Implementation Details: See `BYBIT_IMPLEMENTATION_SUMMARY.md`
- 🔗 Bybit Docs: https://bybit-exchange.github.io/docs
- 📞 Bybit Support: https://www.bybit.com/en/contact

---

**Happy Coding! 🚀**
