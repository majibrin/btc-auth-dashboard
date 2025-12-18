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

    // 3. Robust User Agent Parsing with ENHANCED DEVICE DETECTION
    const rawAgent = req.headers['user-agent'] || '';
    const agent = useragent.parse(rawAgent);

    // UA Details with enhanced device detection
    const browser = agent.family !== 'Other' ? agent.toAgent() : 'Unknown';
    let os = agent.os.family !== 'Other' ? agent.os.toString() : 'Unknown';
    let device = agent.device.family !== 'Other' ? agent.device.toString() : 'Desktop/Unknown';

    // ENHANCED DEVICE DETECTION
    // Detect Android devices better
    if (rawAgent.includes('Android')) {
      // Extract Android version
      const androidVersion = rawAgent.match(/Android\s+([\d.]+)/)?.[1] || '';
      os = `Android ${androidVersion}`;
      
      // Detect device brand/model
      if (rawAgent.includes('TECNO')) {
        const modelMatch = rawAgent.match(/TECNO\s+(\w+)/);
        const model = modelMatch ? modelMatch[1] : 'Phone';
        device = `TECNO ${model}`;
      } else if (rawAgent.includes('Samsung')) {
        device = 'Samsung Phone';
      } else if (rawAgent.includes('Xiaomi')) {
        device = 'Xiaomi Phone';
      } else if (rawAgent.includes('Redmi')) {
        device = 'Redmi Phone';
      } else if (rawAgent.includes('Infinix')) {
        device = 'Infinix Phone';
      } else if (rawAgent.includes('Oppo')) {
        device = 'Oppo Phone';
      } else if (rawAgent.includes('Vivo')) {
        device = 'Vivo Phone';
      } else if (rawAgent.includes('Realme')) {
        device = 'Realme Phone';
      } else if (rawAgent.includes('OnePlus')) {
        device = 'OnePlus Phone';
      } else if (rawAgent.includes('Google')) {
        device = 'Google Pixel';
      } else if (rawAgent.includes('Huawei') || rawAgent.includes('Honor')) {
        device = 'Huawei Phone';
      } else {
        // Generic Android phone with better name
        device = 'Android Phone';
      }
    }

    // Detect iPhones/iPads
    if (rawAgent.includes('iPhone')) {
      device = 'iPhone';
      const versionMatch = rawAgent.match(/iPhone OS (\d+)_(\d+)/);
      if (versionMatch) {
        os = `iOS ${versionMatch[1]}.${versionMatch[2]}`;
      }
    }
    if (rawAgent.includes('iPad')) {
      device = 'iPad';
      if (!rawAgent.includes('iPhone')) {
        const versionMatch = rawAgent.match(/iPad; CPU OS (\d+)_(\d+)/);
        if (versionMatch) {
          os = `iOS ${versionMatch[1]}.${versionMatch[2]}`;
        }
      }
    }

    // Detect Windows/Mac/Linux
    if (rawAgent.includes('Windows')) {
      device = 'Windows PC';
      const winVersion = rawAgent.match(/Windows NT ([\d.]+)/)?.[1] || '';
      if (winVersion === '10.0') os = 'Windows 10/11';
      else if (winVersion === '6.3') os = 'Windows 8.1';
      else if (winVersion === '6.2') os = 'Windows 8';
      else if (winVersion === '6.1') os = 'Windows 7';
      else os = `Windows ${winVersion}`;
    }
    if (rawAgent.includes('Macintosh')) {
      device = 'Mac';
      const macVersion = rawAgent.match(/Mac OS X ([\d_]+)/)?.[1] || '';
      if (macVersion) os = `macOS ${macVersion.replace('_', '.')}`;
    }
    if (rawAgent.includes('Linux') && !rawAgent.includes('Android')) {
      device = 'Linux PC';
    }

    // Detect desktop browsers
    if (rawAgent.includes('Chrome') && !rawAgent.includes('Android') && !rawAgent.includes('iPhone') && !rawAgent.includes('iPad')) {
      device = 'Desktop';
    }
    if (rawAgent.includes('Firefox') && !rawAgent.includes('Android') && !rawAgent.includes('iPhone') && !rawAgent.includes('iPad')) {
      device = 'Desktop';
    }
    if (rawAgent.includes('Safari') && !rawAgent.includes('iPhone') && !rawAgent.includes('iPad') && !rawAgent.includes('Macintosh')) {
      device = 'Desktop';
    }

    return {
      ip,
      isLocal,
      // Map library data with logical fallbacks
      country: geo?.country || 'Unknown',
      city: geo?.city || 'Unknown',
      region: geo?.region || 'Unknown',
      timezone: geo?.timezone || 'UTC',
      ll: geo?.ll || [0, 0], // Latitude/Longitude

      // ENHANCED UA Details
      browser: browser,
      os: os,
      device: device,

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
