const express = require('express');
const { sendMessage } = require('../controllers/sendMessageController');

const router = express.Router();

router.post('/send', sendMessage);

/**
 * Configura as rotas da API
 * @param {Express} app - Instância do Express
 */
function setupApiRoutes(app) {
  app.use('/api/v1', router);
}

module.exports = { setupApiRoutes };
