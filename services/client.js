const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrImageManager = require('./qrImageManager');

let isClientReady = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

const client = new Client({
  authStrategy: new LocalAuth(), // Salva a sessão em .wwebjs_auth/
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 60000 // Timeout maior para inicialização
  }
});

client.on('qr', async (qr) => {
  console.log('🔍 Escaneie o QR Code abaixo:');
  qrcode.generate(qr, { small: true });
  
  // Gera a imagem do QR para a página web
  try {
    await qrImageManager.generate(qr);
    console.log('📸 QR Code salvo para acesso web em /login');
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code para web:', error.message);
    qrImageManager.setError('Erro ao gerar QR Code: ' + error.message);
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp client pronto!');
  isClientReady = true;
  reconnectAttempts = 0;
  qrImageManager.setConnected(true);
});

client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp desconectado:', reason);
  isClientReady = false;
  qrImageManager.setConnected(false);
  qrImageManager.setError('Desconectado: ' + reason);
  
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${maxReconnectAttempts}...`);
    setTimeout(() => {
      client.initialize();
    }, 10000); // Aguarda 10s antes de tentar reconectar
  } else {
    console.log('🚨 Máximo de tentativas de reconexão atingido');
    qrImageManager.setError('Máximo de tentativas de reconexão atingido');
  }
});

client.on('auth_failure', (message) => {
  console.error('❌ Falha na autenticação:', message);
  qrImageManager.setError('Falha na autenticação: ' + message);
});

client.on('loading_screen', (percent, message) => {
  console.log(`⏳ Carregando... ${percent}% - ${message}`);
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
  await ensureClientReady();
  
  try {
    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(`Chat ${chatId} não encontrado`);
    }
    
    return await client.sendMessage(chatId, message);
  } catch (error) {
    console.error(`Erro ao enviar mensagem para ${chatId}:`, error.message);
    throw error;
  }
}

client.initialize();

module.exports = { client, ensureClientReady, sendMessage, isClientReady: () => isClientReady };
