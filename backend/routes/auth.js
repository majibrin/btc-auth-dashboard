import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import axios from 'axios';
import { parseUserInfo } from '../utils/helpers.js';

const router = express.Router();

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'User exists' });

    const userInfo = parseUserInfo(req);

    const user = new User({
      username,
      email,
      password,
      signupInfo: userInfo
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const validPass = await user.comparePassword(password);
    if (!validPass) return res.status(401).json({ message: 'Invalid credentials' });

    const userInfo = parseUserInfo(req);

    user.lastLogin = {
      ip: userInfo.ip,
      timestamp: new Date(),
      browser: userInfo.browser,
      os: userInfo.os,
      device: userInfo.device
    };

    user.loginHistory.push({
      ip: userInfo.ip,
      timestamp: new Date(),
      browser: userInfo.browser,
      os: userInfo.os,
      device: userInfo.device,
      location: {
        country: userInfo.country,
        city: userInfo.city,
        region: userInfo.region
      }
    });

    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// BTC Price 

// BTC Price - Using working API
/*router.get('/btc-price', async (req, res) => {
  console.log('📡 Fetching BTC price...');
  
  try {
    // Try Binance API (usually works)
    const binanceRes = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
      timeout: 5000
    });
    
    if (binanceRes.data && binanceRes.data.price) {
      return res.json({ 
        success: true,
        price: parseFloat(binanceRes.data.price).toFixed(2),
        currency: 'USD',
        source: 'Binance'
      });
    }
    
  } catch (binanceError) {
    console.log('Binance failed, trying CoinGecko...');
  }
  
  try {
    // Fallback: CoinGecko
    const geckoRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
      timeout: 5000
    });
    
    if (geckoRes.data && geckoRes.data.bitcoin && geckoRes.data.bitcoin.usd) {
      return res.json({ 
        success: true,
        price: geckoRes.data.bitcoin.usd.toFixed(2),
        currency: 'USD', 
        source: 'CoinGecko'
      });
    }
    
  } catch (geckoError) {
    console.log('All APIs failed, using mock data');
  }
  
  // Final fallback: Realistic mock
  const basePrice = 45000;
  const randomChange = (Math.random() * 2000) - 1000;
  const currentPrice = basePrice + randomChange;
  
  res.json({ 
    success: true,
    price: currentPrice.toFixed(2),
    currency: 'USD',
    source: 'Mock (APIs blocked)',
    message: 'Real price when deployed'
  });
});

*/

// BTC Price - Using CoinGecko first (confirmed working on Render)
router.get('/btc-price', async (req, res) => {
  console.log('📡 Fetching BTC price...');

  try {
    // FIRST: Try CoinGecko (confirmed working)
    const geckoRes = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { timeout: 3000 }
    );

    if (geckoRes.data?.bitcoin?.usd) {
      return res.json({
        success: true,
        price: parseFloat(geckoRes.data.bitcoin.usd).toFixed(2),
        currency: 'USD',
        source: 'CoinGecko',
        timestamp: new Date().toISOString()
      });
    }
  } catch (geckoError) {
    console.log('CoinGecko failed, trying Binance...');
  }

  try {
    // SECOND: Try Binance
    const binanceRes = await axios.get(
      'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
      { timeout: 3000 }
    );

    if (binanceRes.data?.price) {
      return res.json({
        success: true,
        price: parseFloat(binanceRes.data.price).toFixed(2),
        currency: 'USD',
        source: 'Binance',
        timestamp: new Date().toISOString()
      });
    }
  } catch (binanceError) {
    console.log('Binance failed, trying CoinCap...');
  }

  try {
    // THIRD: Try CoinCap
    const coincapRes = await axios.get(
      'https://api.coincap.io/v2/assets/bitcoin',
      { timeout: 3000 }
    );

    if (coincapRes.data?.data?.priceUsd) {
      return res.json({
        success: true,
        price: parseFloat(coincapRes.data.data.priceUsd).toFixed(2),
        currency: 'USD',
        source: 'CoinCap',
        timestamp: new Date().toISOString()
      });
    }
  } catch (coincapError) {
    console.log('All APIs failed, using realistic mock');
  }

  // Final fallback: Realistic mock based on current ~$87K
  const basePrice = 87000;
  const randomChange = (Math.random() * 1000) - 500;
  const currentPrice = basePrice + randomChange;

  res.json({
    success: true,
    price: currentPrice.toFixed(2),
    currency: 'USD',
    source: 'Mock (APIs temporarily blocked)',
    message: 'Returns real-time price when APIs work',
    timestamp: new Date().toISOString()
  });
});


// Get all users (admin)
router.get('/admin/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find().select('-password -loginHistory');

    res.json({
      success: true,
      users
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
