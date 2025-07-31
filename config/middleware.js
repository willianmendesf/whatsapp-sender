const path = require('path');
const express = require('express');
const logger = require('../utils/logger');

/**
 * Configura os middlewares do Express
 * @param {Express} app - Instância do Express
 */
function setupMiddlewares(app) {
  logger.info('⚙️ Configurando middlewares do Express...');

  // Middleware para parsing de JSON
  app.use(express.json());
  
  // Middleware para arquivos estáticos
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Configurar SSE para logs em tempo real
  logger.setupSSE(app);

  logger.info('✅ Middlewares configurados com sucesso');
}

module.exports = { setupMiddlewares };
