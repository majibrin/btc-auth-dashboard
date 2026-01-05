import geoip from 'geoip-lite';
import DeviceDetector from 'device-detector-js';

/**
 * Normalizes IP addresses and extracts geolocation/browser data.
 */
export const parseUserInfo = (req) => {
  // 1. Precise IP Extraction
  let ip = req.headers['x-forwarded-for']?.split(',')[0] ||
           req.socket?.remoteAddress ||
           req.connection?.remoteAddress ||
           '8.8.8.8';

  // Normalize IPv6 mapped IPv4 addresses
  ip = ip.replace('::ffff:', '').trim();

  // Handle local development bypass
  const isLocal = ip === '127.0.0.1' || ip === '::1';
  const lookupIp = isLocal ? '8.8.8.8' : ip;

  try {
    // 2. Real GeoIP Lookup
    const geo = geoip.lookup(lookupIp);

    // 3. ROBUST Device Detection with device-detector-js
    const rawAgent = req.headers['user-agent'] || '';
    const deviceDetector = new DeviceDetector();
    const deviceResult = deviceDetector.parse(rawAgent);
    
    // Format device info
    let deviceDisplay = 'Desktop/Unknown';
    if (deviceResult.device?.model) {
      deviceDisplay = `${deviceResult.device.brand || ''} ${deviceResult.device.model}`.trim();
    } else if (deviceResult.device?.type) {
      deviceDisplay = deviceResult.device.type;
    }

    return {
      ip,
      isLocal,
      // Geolocation
      country: geo?.country || 'Unknown',
      city: geo?.city || 'Unknown',
      region: geo?.region || 'Unknown',
      timezone: geo?.timezone || 'UTC',
      ll: geo?.ll || [0, 0],
      
      // Device Details
      browser: deviceResult.client?.name || 'Unknown',
      browserVersion: deviceResult.client?.version || '',
      os: deviceResult.os?.name || 'Unknown',
      osVersion: deviceResult.os?.version || '',
      device: deviceDisplay,
      deviceBrand: deviceResult.device?.brand || 'Unknown',
      deviceModel: deviceResult.device?.model || 'Unknown',
      deviceType: deviceResult.device?.type || 'desktop',
      
      userAgent: rawAgent,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Info Parsing Error:', error);
    return {
      ip,
      country: 'Unknown',
      city: 'Unknown',
      browser: 'Error Fallback',
      os: 'Unknown',
      device: 'Desktop/Unknown'
    };
  }
};
