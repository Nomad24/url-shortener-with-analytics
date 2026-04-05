import { prisma } from '../config/prisma.js';
import { generateCode } from '../utils/generateCode.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

function getExpiresAt(days) {
  return new Date(Date.now() + days * MS_IN_DAY);
}

export class LinkService {
  async createGuestLink(originalUrl, guestId) {
    const shortCode = await generateCode();

    const link = await prisma.link.create({
      data: {
        shortCode,
        originalUrl,
        guestId,
        userId: null,
        expiresAt: getExpiresAt(env.GUEST_LINK_EXPIRES_DAYS),
      },
    });

    return link;
  }

  async createAuthLink(originalUrl, userId, title) {
    const shortCode = await generateCode();

    const link = await prisma.link.create({
      data: {
        shortCode,
        originalUrl,
        userId,
        title,
        expiresAt: getExpiresAt(env.USER_LINK_EXPIRES_DAYS),
      },
    });

    return link;
  }

  async getUserLinks(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where: { userId },
        include: {
          _count: {
            select: { clicks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.link.count({ where: { userId } }),
    ]);

    return {
      links: links.map((link) => ({
        ...link,
        clicksCount: link._count.clicks,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLinkById(linkId, userId) {
    const link = await prisma.link.findFirst({
      where: {
        id: linkId,
        userId,
      },
      include: {
        _count: {
          select: { clicks: true },
        },
      },
    });

    if (!link) {
      throw new AppError('Link not found', 404);
    }

    return {
      ...link,
      clicksCount: link._count.clicks,
    };
  }

  async updateLink(linkId, userId, data) {
    const link = await prisma.link.findFirst({
      where: { id: linkId, userId },
    });

    if (!link) {
      throw new AppError('Link not found', 404);
    }

    const updated = await prisma.link.update({
      where: { id: linkId },
      data: {
        title: data.title !== undefined ? data.title : link.title,
        isActive: data.isActive !== undefined ? data.isActive : link.isActive,
        expiresAt: data.expiresAt !== undefined ? data.expiresAt : link.expiresAt,
      },
    });

    return updated;
  }

  async deleteLink(linkId, userId) {
    const link = await prisma.link.findFirst({
      where: { id: linkId, userId },
    });

    if (!link) {
      throw new AppError('Link not found', 404);
    }

    await prisma.link.delete({
      where: { id: linkId },
    });

    return { success: true };
  }

  async getLinkByShortCode(shortCode) {
    return prisma.link.findUnique({
      where: { shortCode },
    });
  }
}
