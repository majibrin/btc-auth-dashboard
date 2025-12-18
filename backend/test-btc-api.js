import axios from 'axios';

console.log('🧪 Testing BTC APIs from Render server...\n');

const apis = [
  {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    parser: (data) => data.bitcoin?.usd
  },
  {
    name: 'Binance',
    url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
    parser: (data) => data.price
  },
  {
    name: 'CoinCap',
    url: 'https://api.coincap.io/v2/assets/bitcoin',
    parser: (data) => data.data?.priceUsd
  }
];

async function testApis() {
  for (const api of apis) {
    try {
      console.log(`🔍 Testing ${api.name}...`);
      const response = await axios.get(api.url, { timeout: 5000 });
      
      if (response.data) {
        const price = api.parser(response.data);
        if (price) {
          console.log(`✅ ${api.name} WORKING: $${parseFloat(price).toFixed(2)}`);
          return { working: true, api: api.name, price: price };
        }
      }
      console.log(`❌ ${api.name}: No price data`);
    } catch (err) {
      console.log(`❌ ${api.name} FAILED: ${err.message}`);
    }
    console.log('---');
  }
  
  console.log('😞 All APIs failed');
  return { working: false };
}

testApis().then(result => {
  console.log('\n🎯 Result:', result);
  process.exit(0);
});
