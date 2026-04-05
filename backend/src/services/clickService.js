import { parseUA } from '../utils/parseUA.js';
import { prisma } from '../config/prisma.js';

const geoCache = new Map();
const uniqueClicks = new Map();

export class GeoService {
  async lookup(ip) {
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: null, city: null };
    }

    const cached = geoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached.data;
    }

    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`);
      const data = await response.json();

      const result = {
        country: data.country || null,
        city: data.city || null,
      };

      geoCache.set(ip, { data: result, timestamp: Date.now() });
      return result;
    } catch {
      return { country: null, city: null };
    }
  }
}

export class ClickService {
  constructor() {
    this.geoService = new GeoService();
  }

  async recordClick(linkId, req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.socket.remoteAddress || 
               req.ip;

    const ua = parseUA(req.headers['user-agent']);
    const geo = await this.geoService.lookup(ip);

    const uniqueKey = `${linkId}:${ip}`;
    const now = Date.now();
    const isUnique = !uniqueClicks.has(uniqueKey) || 
                     (now - uniqueClicks.get(uniqueKey)) > 24 * 60 * 60 * 1000;

    if (isUnique) {
      uniqueClicks.set(uniqueKey, now);
    }

    await prisma.click.create({
      data: {
        linkId,
        ip,
        country: geo.country,
        city: geo.city,
        device: ua.device,
        browser: ua.browser,
        os: ua.os,
        referer: req.headers.referer || null,
        isUnique,
      },
    });
  }

  isUniqueClick(linkId, ip) {
    const key = `${linkId}:${ip}`;
    const lastClick = uniqueClicks.get(key);
    const now = Date.now();

    if (!lastClick || (now - lastClick) > 24 * 60 * 60 * 1000) {
      uniqueClicks.set(key, now);
      return true;
    }

    return false;
  }
}
