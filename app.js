const express = require('express');
const logger = require('./utils/logger');
const routes = require('./routes/routes');
const client = require('./services/client');
const router = express.Router();

const { setupAppRoutes } = require('./routes/appRoutes');
const { setupAuthRoutes } = require('./routes/authRoutes');
const { setupMiddlewares } = require('./config/middleware');
const { initializeWhatsApp, startServer } = require('./config/server');

// Log de inicialização
logger.info('🚀 Aplicação iniciando...');

const app = express();
const PORT = process.env.PORT || 3200;

app.use(express.json());
app.use('/api/v1', routes);

// Inicializa o cliente WhatsApp
initializeWhatsApp();

// Configura middlewares
setupMiddlewares(app);

// Configura rotas da aplicação
setupAppRoutes(app);

// Configura rotas de autenticação
setupAuthRoutes(app);

// Inicia o servidor
startServer(app, PORT);