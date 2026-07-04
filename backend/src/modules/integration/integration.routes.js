const express = require('express');
const { successResponse } = require('../../core/utils/responseFormatter');
const router = express.Router();

/**
 * Empty placeholder module for future external webhooks and integrations
 * (e.g., Stripe webhooks, Zapier integrations, Slack bots)
 */
router.get('/health', (req, res) => {
  return successResponse(res, 200, 'Integrations module active');
});

module.exports = router;
