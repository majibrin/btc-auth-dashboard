import geoip from 'geoip-lite';
import useragent from 'useragent';

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
    // 2. Real GeoIP Lookup (Actually using the library)
    const geo = geoip.lookup(lookupIp);

    // 3. Robust User Agent Parsing
    const rawAgent = req.headers['user-agent'] || '';
    const agent = useragent.parse(rawAgent);

    return {
      ip,
      isLocal,
      // Map library data with logical fallbacks
      country: geo?.country || 'Unknown',
      city: geo?.city || 'Unknown',
      region: geo?.region || 'Unknown',
      timezone: geo?.timezone || 'UTC',
      ll: geo?.ll || [0, 0], // Latitude/Longitude
      
      // UA Details
      browser: agent.family !== 'Other' ? agent.toAgent() : 'Unknown',
      os: agent.os.family !== 'Other' ? agent.os.toString() : 'Unknown',
      device: agent.device.family !== 'Other' ? agent.device.toString() : 'Desktop/Unknown',
      
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
      os: 'Unknown'
    };
  }
};
