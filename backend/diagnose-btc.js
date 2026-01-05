import axios from 'axios';

console.log('🔍 Diagnosing BTC API issue...\n');

async function testCoinGecko() {
  console.log('1. Testing CoinGecko API directly...');
  try {
    const start = Date.now();
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { 
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );
    const time = Date.now() - start;
    
    console.log(`✅ Response time: ${time}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`💰 Data: ${JSON.stringify(response.data)}`);
    
    // Check if price exists
    if (response.data?.bitcoin?.usd) {
      console.log(`🎯 PRICE FOUND: $${response.data.bitcoin.usd}`);
      return { success: true, price: response.data.bitcoin.usd };
    } else {
      console.log('❌ Price not in expected format');
      console.log('Full response structure:', Object.keys(response.data));
      return { success: false, reason: 'Wrong format' };
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Headers: ${JSON.stringify(error.response.headers)}`);
    }
    return { success: false, reason: error.message };
  }
}

async function runDiagnosis() {
  const result = await testCoinGecko();
  console.log('\n🎯 DIAGNOSIS COMPLETE:');
  console.log(`CoinGecko working: ${result.success ? 'YES' : 'NO'}`);
  if (!result.success) console.log(`Reason: ${result.reason}`);
  console.log('\n💡 RECOMMENDATION:');
  if (result.success) {
    console.log('Increase timeout from 3000ms to 10000ms in auth.js');
  } else {
    console.log('CoinGecko blocked on Render. Use alternative API.');
  }
}

runDiagnosis();
