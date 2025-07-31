const path = require('path');
const logger = require('../utils/logger');

/**
 * Inicializa o cliente WhatsApp
 */
function initializeWhatsApp() {
  logger.info('📱 Inicializando cliente WhatsApp...');
  require('../utils/whatsappClient');
}

/**
 * Inicia o servidor na porta especificada
 * @param {Express} app - Instância do Express
 * @param {number} port - Porta do servidor
 */
function startServer(app, port) {
  app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    logger.info(`🚀 Servidor iniciado na porta ${port}`);
  });
}

module.exports = { 
  initializeWhatsApp,
  startServer 
};
