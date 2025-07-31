const express = require('express');
const logger = require('./utils/logger');
const sendRoute = require('./routes/routes');
const client = require('./services/client');
const router = express.Router();

const { setupAuthRoutes } = require('./routes/authRoutes');
const { setupMiddlewares } = require('./config/middleware');
const { initializeWhatsApp, startServer } = require('./config/server');

// Log de inicialização
logger.info('🚀 Aplicação iniciando...');

const app = express();
const PORT = process.env.PORT || 3200;

app.use(express.json());
app.use('/api/v1', sendRoute);

// Inicializa o cliente WhatsApp
initializeWhatsApp();

// Configura middlewares
setupMiddlewares(app);

// Configura rotas de autenticação
setupAuthRoutes(app);

// Inicia o servidor
startServer(app, PORT);