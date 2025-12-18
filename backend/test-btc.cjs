const https = require('https');

console.log('🧪 Testing BTC APIs from Render server...\n');

const apis = [
  {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
  },
  {
    name: 'Binance',
    url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'
  },
  {
    name: 'CoinCap',
    url: 'https://api.coincap.io/v2/assets/bitcoin'
  }
];

function testApi(api) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing ${api.name}...`);
    
    const req = https.get(api.url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${api.name} RESPONDED (Status: ${res.statusCode})`);
          console.log('📊 Data sample:', JSON.stringify(json).substring(0, 80) + '...');
          resolve({ working: true, api: api.name, data: json });
        } catch {
          console.log(`⚠️ ${api.name}: Could not parse JSON`);
          resolve({ working: false, api: api.name });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${api.name} FAILED: ${err.message}`);
      resolve({ working: false, api: api.name });
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏱️ ${api.name} TIMEOUT (5s)`);
      req.destroy();
      resolve({ working: false, api: api.name });
    });
  });
}

async function runTests() {
  for (const api of apis) {
    await testApi(api);
    console.log('---');
  }
  console.log('🎯 Tests completed');
}

runTests();
