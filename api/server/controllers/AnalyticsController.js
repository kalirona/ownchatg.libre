const { logger } = require('@librechat/data-schemas');
const analyticsService = require('~/server/services/AnalyticsService');

async function getAnalytics(req, res) {
  try {
    const period = req.query.period || '30d';
    if (!['7d', '30d', '90d', '1y'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period. Use 7d, 30d, 90d, or 1y.' });
    }
    const data = await analyticsService.getAnalytics(period);
    res.json(data);
  } catch (error) {
    logger.error('[AnalyticsController] getAnalytics', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
}

module.exports = { getAnalytics };
