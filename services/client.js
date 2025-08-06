const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrImageManager = require('../utils/qrImageManager');
const logger = require('../utils/logger');

let isClientReady = false;
let reconnectAttempts = 0;
const pendingMessages = [];
const maxReconnectAttempts = 5;

const client = new Client({
  authStrategy: new LocalAuth(), // Salva a sessão em .wwebjs_auth/
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 60000 // Timeout maior para inicialização
  }
});

client.on('qr', async (qr) => {
  logger.info('🔍 Escaneie o QR Code abaixo:');
  qrcode.generate(qr, { small: true });
  
  // Gera a imagem do QR para a página web
  try {
    await qrImageManager.generate(qr);
    logger.info('📸 QR Code salvo para acesso web em /login');
  } catch (error) {
    logger.error('❌ Erro ao gerar QR Code para web:', error.message);
    qrImageManager.setError('Erro ao gerar QR Code: ' + error.message);
  }
});

client.on('ready', async () => {
  logger.info('✅ WhatsApp client pronto!');
  isClientReady = true;
  reconnectAttempts = 0;
  qrImageManager.setConnected(true);

  const chats = await client.getChats();
  const grupos = chats.filter(chat => chat.isGroup);

  logger.info('Grupos encontrados:');
  grupos.forEach((grupo, index) => {
    logger.info(`${index + 1}. Nome: ${grupo.name} | ID: ${grupo.id._serialized}`);
  });

  if (pendingMessages.length) {
    logger.info(`📤 Processando ${pendingMessages.length} mensagem(ns) pendente(s)...`);
    while (pendingMessages.length) {
      const { chatId, message, resolve, reject } = pendingMessages.shift();
      try {
        const sent = await sendMessage(chatId, message);
        resolve(sent);
      } catch (error) {
        reject(error);
      }
    }
  }
});


client.on('disconnected', (reason) => {
  logger.info('❌ WhatsApp desconectado:', reason);
  isClientReady = false;
  qrImageManager.setConnected(false);
  qrImageManager.setError('Desconectado: ' + reason);
  
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    logger.info(`🔄 Tentativa de reconexão ${reconnectAttempts}/${maxReconnectAttempts}...`);
    setTimeout(() => {
      client.initialize();
    }, 10000); // Aguarda 10s antes de tentar reconectar
  } else {
    logger.info('🚨 Máximo de tentativas de reconexão atingido');
    qrImageManager.setError('Máximo de tentativas de reconexão atingido');
  }
});

client.on('auth_failure', (message) => {
  logger.error('❌ Falha na autenticação:', message);
  qrImageManager.setError('Falha na autenticação: ' + message);
});

client.on('loading_screen', (percent, message) => {
  logger.info(`⏳ Carregando... ${percent}% - ${message}`);
});

// Função para verificar se o cliente está pronto
async function ensureClientReady() {
  if (!isClientReady) {
    throw new Error('WhatsApp client não está pronto. Verifique a conexão.');
  }
  
  try {
    // Testa se o cliente ainda está funcional
    await client.getState();
    return true;
  } catch (error) {
    isClientReady = false;
    throw new Error('WhatsApp client perdeu a conexão: ' + error.message);
  }
}

// Função melhorada para envio de mensagens
async function sendMessage(chatId, message) {
  if (!isClientReady) {
    logger.warn(`🕒 [Mensagem Pendente] Cliente não pronto. Aguardando para enviar mensagem para ${chatId}...`);
    return new Promise((resolve, reject) => {
      pendingMessages.push({ chatId, message, resolve, reject });
    });
  }

  try {
    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(`Chat ${chatId} não encontrado`);
    }

    const sent = await client.sendMessage(chatId, message);
    logger.info(`✅ [Mensagem] Mensagem enviada para ${chatId}`);
    return sent;
  } catch (error) {
    logger.error(`❌ [Erro de Envio] Falha ao enviar para ${chatId}:`, error.message);
    throw error;
  }
}

async function findContactById(contactId) {
  const contacts = await client.getContacts();
  return contacts.find(c => c.id._serialized === contactId);
}


client.initialize();

module.exports = { client, ensureClientReady, sendMessage, findContactById, isClientReady: () => isClientReady };
