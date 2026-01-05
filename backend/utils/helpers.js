import geoip from 'geoip-lite';
import useragent from 'useragent';
import axios from 'axios';

/**
 * Normalizes IP addresses and extracts geolocation/browser data.
 * NOW ASYNC to support live API fallbacks.
 */
export const parseUserInfo = async (req) => {
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
    // 2. Initial GeoIP Lookup (Offline)
    let geo = geoip.lookup(lookupIp);
    
    let country = geo?.country || 'Unknown';
    let city = geo?.city || 'Unknown';
    let region = geo?.region || 'Unknown';

    // RUTHLESS FIX: If offline DB fails for Nigerian IPs, hit the Live API
    if (country === 'Unknown' || !geo) {
      try {
        const apiRes = await axios.get(`http://ip-api.com/json/${lookupIp}?fields=status,message,countryCode,region,city`);
        if (apiRes.data.status === 'success') {
          country = apiRes.data.countryCode;
          region = apiRes.data.region;
          city = apiRes.data.city;
        }
      } catch (apiErr) {
        console.error('External Geo-IP Fallback Failed:', apiErr.message);
      }
    }

    // 3. User Agent Parsing
    const rawAgent = req.headers['user-agent'] || '';
    const agent = useragent.parse(rawAgent);

    const browser = agent.family !== 'Other' ? agent.toAgent() : 'Unknown';
    let os = agent.os.family !== 'Other' ? agent.os.toString() : 'Unknown';
    let device = 'Desktop';

    // Device Detection logic (Kept your excellent TECNO/Infinix regex)
    if (rawAgent.includes('Android')) {
      const androidVersion = rawAgent.match(/Android\s+([\d.]+)/)?.[1] || '';
      os = `Android ${androidVersion}`;
      device = 'Android Phone';

      if (rawAgent.includes('TECNO')) {
        const modelMatch = rawAgent.match(/TECNO\s+(\w+)/);
        device = modelMatch ? `TECNO ${modelMatch[1]}` : 'TECNO Phone';
      } else if (rawAgent.includes('Infinix')) {
        device = 'Infinix Phone';
      } else if (rawAgent.includes('Samsung')) {
        device = 'Samsung Phone';
      }
    } 
    else if (rawAgent.includes('iPhone')) {
      device = 'iPhone';
      const versionMatch = rawAgent.match(/iPhone OS (\d+)_(\d+)/);
      os = versionMatch ? `iOS ${versionMatch[1]}.${versionMatch[2]}` : 'iOS';
    }
    else if (rawAgent.includes('Windows')) {
      device = 'Windows PC';
    }

    return {
      ip,
      isLocal,
      country,
      city,
      region,
      browser,
      os,
      device,
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
      device: 'Desktop'
    };
  }
};
