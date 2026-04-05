import { prisma } from '../config/prisma.js';

export class AnalyticsService {
  async getDateRange(period, from, to) {
    const now = new Date();
    let startDate, endDate;

    if (period) {
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = new Date(0);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      endDate = now;
    } else if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
    }

    return { startDate, endDate };
  }

  async getUserLinkIds(userId) {
    const links = await prisma.link.findMany({
      where: { userId },
      select: { id: true },
    });
    return links.map((l) => l.id);
  }

  async getOverview(userId, period, from, to) {
    const { startDate, endDate } = await this.getDateRange(period, from, to);
    const linkIds = await this.getUserLinkIds(userId);

    if (linkIds.length === 0) {
      return {
        totalClicks: 0,
        uniqueClicks: 0,
        activeLinks: 0,
        totalLinks: 0,
      };
    }

    const [totalClicks, uniqueClicks, activeLinks, totalLinks] = await Promise.all([
      prisma.click.count({
        where: {
          linkId: { in: linkIds },
          clickedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.click.count({
        where: {
          linkId: { in: linkIds },
          isUnique: true,
          clickedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.link.count({
        where: { userId, isActive: true },
      }),
      prisma.link.count({
        where: { userId },
      }),
    ]);

    return {
      totalClicks,
      uniqueClicks,
      activeLinks,
      totalLinks,
    };
  }

  async getClicksOverTime(userId, period, from, to, linkId) {
    const { startDate, endDate } = await this.getDateRange(period, from, to);
    
    let linkIds;
    if (linkId) {
      const link = await prisma.link.findFirst({
        where: { id: linkId, userId },
        select: { id: true },
      });
      if (!link) return [];
      linkIds = [linkId];
    } else {
      linkIds = await this.getUserLinkIds(userId);
    }

    if (linkIds.length === 0) return [];

    const result = await prisma.$queryRaw`
      SELECT 
        DATE("clickedAt")::text AS date,
        COUNT(*)::int AS count,
        COUNT(CASE WHEN "isUnique" THEN 1 END)::int AS unique_count
      FROM clicks
      WHERE "linkId" = ANY(${linkIds}::text[])
        AND "clickedAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE("clickedAt")
      ORDER BY date ASC
    `;

    return result.map((r) => ({
      date: r.date,
      count: r.count,
      uniqueCount: r.unique_count,
    }));
  }

  async getGeography(userId, period, from, to, linkId) {
    const { startDate, endDate } = await this.getDateRange(period, from, to);
    
    let linkIds;
    if (linkId) {
      const link = await prisma.link.findFirst({
        where: { id: linkId, userId },
        select: { id: true },
      });
      if (!link) return [];
      linkIds = [linkId];
    } else {
      linkIds = await this.getUserLinkIds(userId);
    }

    if (linkIds.length === 0) return [];

    const result = await prisma.$queryRaw`
      SELECT 
        COALESCE(country, 'Unknown') AS country,
        COUNT(*)::int AS count
      FROM clicks
      WHERE "linkId" = ANY(${linkIds}::text[])
        AND "clickedAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;

    return result.map((r) => ({
      country: r.country,
      count: r.count,
    }));
  }

  async getDevices(userId, period, from, to, linkId) {
    const { startDate, endDate } = await this.getDateRange(period, from, to);
    
    let linkIds;
    if (linkId) {
      const link = await prisma.link.findFirst({
        where: { id: linkId, userId },
        select: { id: true },
      });
      if (!link) return [];
      linkIds = [linkId];
    } else {
      linkIds = await this.getUserLinkIds(userId);
    }

    if (linkIds.length === 0) return [];

    const result = await prisma.$queryRaw`
      SELECT 
        COALESCE(device, 'unknown') AS device,
        COUNT(*)::int AS count
      FROM clicks
      WHERE "linkId" = ANY(${linkIds}::text[])
        AND "clickedAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY device
      ORDER BY count DESC
    `;

    const total = result.reduce((sum, r) => sum + r.count, 0);

    return result.map((r) => ({
      device: r.device,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));
  }

  async getBrowsers(userId, period, from, to, linkId) {
    const { startDate, endDate } = await this.getDateRange(period, from, to);
    
    let linkIds;
    if (linkId) {
      const link = await prisma.link.findFirst({
        where: { id: linkId, userId },
        select: { id: true },
      });
      if (!link) return [];
      linkIds = [linkId];
    } else {
      linkIds = await this.getUserLinkIds(userId);
    }

    if (linkIds.length === 0) return [];

    const result = await prisma.$queryRaw`
      SELECT 
        COALESCE(browser, 'Unknown') AS browser,
        COUNT(*)::int AS count
      FROM clicks
      WHERE "linkId" = ANY(${linkIds}::text[])
        AND "clickedAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 6
    `;

    return result.map((r) => ({
      browser: r.browser,
      count: r.count,
    }));
  }

  async getReferrers(userId, period, from, to, linkId) {
    const { startDate, endDate } = await this.getDateRange(period, from, to);
    
    let linkIds;
    if (linkId) {
      const link = await prisma.link.findFirst({
        where: { id: linkId, userId },
        select: { id: true },
      });
      if (!link) return [];
      linkIds = [linkId];
    } else {
      linkIds = await this.getUserLinkIds(userId);
    }

    if (linkIds.length === 0) return [];

    const result = await prisma.$queryRaw`
      SELECT 
        COALESCE(referer, 'Direct') AS referer,
        COUNT(*)::int AS count
      FROM clicks
      WHERE "linkId" = ANY(${linkIds}::text[])
        AND "clickedAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY referer
      ORDER BY count DESC
      LIMIT 10
    `;

    return result.map((r) => ({
      referer: r.referer,
      count: r.count,
    }));
  }

  async getHeatmap(userId, period, from, to, linkId) {
    const { startDate, endDate } = await this.getDateRange(period, from, to);
    
    let linkIds;
    if (linkId) {
      const link = await prisma.link.findFirst({
        where: { id: linkId, userId },
        select: { id: true },
      });
      if (!link) return [];
      linkIds = [linkId];
    } else {
      linkIds = await this.getUserLinkIds(userId);
    }

    if (linkIds.length === 0) return [];

    const result = await prisma.$queryRaw`
      SELECT 
        EXTRACT(DOW FROM "clickedAt")::int AS day,
        EXTRACT(HOUR FROM "clickedAt")::int AS hour,
        COUNT(*)::int AS count
      FROM clicks
      WHERE "linkId" = ANY(${linkIds}::text[])
        AND "clickedAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY EXTRACT(DOW FROM "clickedAt"), EXTRACT(HOUR FROM "clickedAt")
      ORDER BY day, hour
    `;

    return result.map((r) => ({
      day: r.day,
      hour: r.hour,
      count: r.count,
    }));
  }
}
