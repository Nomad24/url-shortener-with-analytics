import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { authGuard } from '../middleware/authGuard.js';

const router = Router();
const analyticsController = new AnalyticsController();

router.get('/overview', authGuard, analyticsController.getOverview);
router.get('/clicks', authGuard, analyticsController.getClicks);
router.get('/geography', authGuard, analyticsController.getGeography);
router.get('/devices', authGuard, analyticsController.getDevices);
router.get('/browsers', authGuard, analyticsController.getBrowsers);
router.get('/referrers', authGuard, analyticsController.getReferrers);
router.get('/heatmap', authGuard, analyticsController.getHeatmap);

export default router;
