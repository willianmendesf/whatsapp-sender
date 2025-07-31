const logger = require('../utils/logger');
const qrImageManager = require('../utils/qrImageManager');

/**
 * Configura as rotas de autenticação e sessão
 * @param {Express} app - Instância do Express
 */
function setupAuthRoutes(app) {
  // Endpoint para retornar o QR Code gerado
  app.get('/login', (req, res) => {
    try {
      const html = qrImageManager.getHTML();
      res.send(html);
    } catch (error) {
      logger.error('Erro ao acessar interface de login:', error.message);
      res.status(500).send('❌ Erro interno do servidor ao carregar interface de login');
    }
  });

  // Endpoint para limpar sessão em caso de problemas
  app.get('/clear-session', (req, res) => {
    try {
      const cleared = qrImageManager.clearSession();
      if (cleared) {
        logger.info('🧹 Sessão limpa pelo usuário');
        res.send(`
          <html>
            <head>
              <meta http-equiv="refresh" content="3; url=/">
              <title>Sessão Limpa</title>
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  text-align: center; 
                  background: linear-gradient(135deg, #f093fb, #f5576c);
                  color: white;
                  padding: 50px;
                  margin: 0;
                  min-height: 100vh;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                }
                h1 { font-size: 2.5em; margin-bottom: 20px; }
                p { font-size: 1.2em; margin-bottom: 30px; }
              </style>
            </head>
            <body>
              <h1>🧹 Sessão Limpa!</h1>
              <p>A sessão do WhatsApp foi limpa com sucesso.</p>
              <p>Redirecionando para nova conexão...</p>
            </body>
          </html>
        `);
      } else {
        res.status(500).send('❌ Erro ao limpar sessão');
      }
    } catch (error) {
      logger.error('Erro ao limpar sessão:', error.message);
      res.status(500).send('❌ Erro interno do servidor');
    }
  });
}

module.exports = { setupAuthRoutes };
