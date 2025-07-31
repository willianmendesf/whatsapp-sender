const express = require('express');
const client = require('./services/client');
const sendRoute = require('./controllers/sendMessageController');
const { initializeWhatsApp, startServer } = require('./config/server');

// Log de inicialização
logger.info('🚀 Aplicação iniciando...');

// Inicializa o cliente WhatsApp
initializeWhatsApp();

const app = express();
const PORT = process.env.PORT || 3200;

app.use(express.json());

app.use('/api/v1', sendRoute);

client.initialize();

// Inicia o servidor
startServer(app, PORT);