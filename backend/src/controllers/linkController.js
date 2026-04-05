import { LinkService } from '../services/linkService.js';
import { ClickService } from '../services/clickService.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { nanoid } from 'nanoid';

const linkService = new LinkService();
const clickService = new ClickService();

export class LinkController {
  async createGuest(req, res, next) {
    try {
      const { url } = req.body;
      
      let guestId = req.cookies?.guestId;
      if (!guestId) {
        guestId = nanoid();
        res.cookie('guestId', guestId, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
      }

      const link = await linkService.createGuestLink(url, guestId);

      res.status(201).json({
        success: true,
        data: {
          shortUrl: `${env.BASE_URL}/${link.shortCode}`,
          shortCode: link.shortCode,
          originalUrl: link.originalUrl,
        },
        message: 'Link created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createAuth(req, res, next) {
    try {
      const { url, title } = req.body;
      const userId = req.user.id;

      const link = await linkService.createAuthLink(url, userId, title);

      res.status(201).json({
        success: true,
        data: {
          id: link.id,
          shortUrl: `${env.BASE_URL}/${link.shortCode}`,
          shortCode: link.shortCode,
          originalUrl: link.originalUrl,
          title: link.title,
          isActive: link.isActive,
          createdAt: link.createdAt,
        },
        message: 'Link created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await linkService.getUserLinks(userId, page, limit);
      const linksWithShortUrl = result.links.map((link) => ({
        ...link,
        shortUrl: `${env.BASE_URL}/${link.shortCode}`,
      }));

      res.json({
        success: true,
        data: {
          ...result,
          links: linksWithShortUrl,
        },
        message: 'Links retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const link = await linkService.getLinkById(id, userId);

      res.json({
        success: true,
        data: {
          ...link,
          shortUrl: `${env.BASE_URL}/${link.shortCode}`,
        },
        message: 'Link retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, isActive, expiresAt } = req.body;

      const link = await linkService.updateLink(id, userId, {
        title,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.json({
        success: true,
        data: link,
        message: 'Link updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await linkService.deleteLink(id, userId);

      res.json({
        success: true,
        data: null,
        message: 'Link deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async redirect(req, res, next) {
    try {
      const { shortCode } = req.params;

      const link = await linkService.getLinkByShortCode(shortCode);

      if (!link || !link.isActive) {
        return res.redirect('/not-found?reason=not-found');
      }

      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.redirect('/not-found?reason=expired');
      }

      setImmediate(() => {
        clickService.recordClick(link.id, req).catch(console.error);
      });

      res.redirect(302, link.originalUrl);
    } catch (error) {
      next(error);
    }
  }
}
