const path = require('path');
const express = require('express');
const logger = require('../utils/logger');

/**
 * Configura os middlewares do Express
 * @param {Express} app - Instância do Express
 */
function setupMiddlewares(app) {
  logger.info('⚙️ Configurando Express e SSE...');

  // Configurar SSE para logs em tempo real
  logger.setupSSE(app);

  // Para postar arquivo de log via HTTP
  logger.info('🌐 Configurando servidor Express...');
  app.use(express.static(path.join(__dirname, '..', 'public')));
}

module.exports = { setupMiddlewares };
