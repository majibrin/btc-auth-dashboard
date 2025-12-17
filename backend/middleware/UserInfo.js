// backend/middleware/userInfo.js
import geoip from 'geoip-lite';
import useragent from 'useragent';

export const parseUserInfo = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip.replace('::ffff:', ''));
  const agent = useragent.parse(req.headers['user-agent']);
  
  return {
    ip: ip,
    country: geo?.country || 'Unknown',
    city: geo?.city || 'Unknown',
    region: geo?.region || 'Unknown',
    timezone: geo?.timezone || 'Unknown',
    browser: agent.toAgent(),
    os: agent.os.toString(),
    device: agent.device.toString() || 'Desktop',
    userAgent: req.headers['user-agent']
  };
};
