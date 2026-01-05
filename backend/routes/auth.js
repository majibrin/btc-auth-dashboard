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
    { expiresIn: '1h' } // REDUCED from 7d for security. 
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ success: false, message: 'User exists' });

    // FULL FIX: Await the async helper to get real Geo-IP data
    const userInfo = await parseUserInfo(req);

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
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password'); // Ensure password is selected
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const validPass = await user.comparePassword(password);
    if (!validPass) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // FULL FIX: Await the async helper for accurate login tracking
    const userInfo = await parseUserInfo(req);

    // Update last login
    user.lastLogin = {
      ip: userInfo.ip,
      timestamp: new Date(),
      browser: userInfo.browser,
      os: userInfo.os,
      device: userInfo.device
    };

    // Push to history
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
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// BTC Price with improved error handling
router.get('/btc-price', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { 
        timeout: 8000,
        headers: { 'Accept': 'application/json' }
      }
    );

    if (response.data?.bitcoin?.usd) {
      return res.json({
        success: true,
        price: response.data.bitcoin.usd.toFixed(2),
        source: 'CoinGecko'
      });
    }
    throw new Error('API structure invalid');
  } catch (error) {
    // Fallback to Blockchain API before using Mock
    try {
        const b = await axios.get('https://api.blockchain.com/v3/exchange/tickers/BTC-USD');
        return res.json({ success: true, price: b.data.last_trade_price.toFixed(2), source: 'Blockchain' });
    } catch (e) {
        res.json({ success: true, price: "86629.41", source: 'Static Fallback' });
    }
  }
});

// Admin: Get all users
router.get('/admin/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    }

    // Optimization: Exclude heavy login history to keep Admin Panel fast
    const users = await User.find().select('-password -loginHistory').sort({ createdAt: -1 });

    res.json({ success: true, users });

  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
});

export default router;
