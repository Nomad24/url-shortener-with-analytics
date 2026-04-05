import { AnalyticsService } from '../services/analyticsService.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const userId = req.user.id;
      const { period, from, to } = req.query;

      const data = await analyticsService.getOverview(userId, period, from, to);

      res.json({
        success: true,
        data,
        message: 'Analytics overview retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

  async getClicks(req, res, next) {
    try {
      const userId = req.user.id;
      const { period, from, to, linkId } = req.query;

      const data = await analyticsService.getClicksOverTime(userId, period, from, to, linkId);

      res.json({
        success: true,
        data,
        message: 'Clicks data retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

  async getGeography(req, res, next) {
    try {
      const userId = req.user.id;
      const { period, from, to, linkId } = req.query;

      const data = await analyticsService.getGeography(userId, period, from, to, linkId);

      res.json({
        success: true,
        data,
        message: 'Geography data retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

  async getDevices(req, res, next) {
    try {
      const userId = req.user.id;
      const { period, from, to, linkId } = req.query;

      const data = await analyticsService.getDevices(userId, period, from, to, linkId);

      res.json({
        success: true,
        data,
        message: 'Devices data retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrowsers(req, res, next) {
    try {
      const userId = req.user.id;
      const { period, from, to, linkId } = req.query;

      const data = await analyticsService.getBrowsers(userId, period, from, to, linkId);

      res.json({
        success: true,
        data,
        message: 'Browsers data retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

  async getReferrers(req, res, next) {
    try {
      const userId = req.user.id;
      const { period, from, to, linkId } = req.query;

      const data = await analyticsService.getReferrers(userId, period, from, to, linkId);

      res.json({
        success: true,
        data,
        message: 'Referrers data retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

  async getHeatmap(req, res, next) {
    try {
      const userId = req.user.id;
      const { period, from, to, linkId } = req.query;

      const data = await analyticsService.getHeatmap(userId, period, from, to, linkId);

      res.json({
        success: true,
        data,
        message: 'Heatmap data retrieved',
      });
    } catch (error) {
      next(error);
    }
  }
}
