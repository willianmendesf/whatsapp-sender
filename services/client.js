const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.on('qr', qr => {
  console.log('Escaneie o QR code para autenticar:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Cliente do WhatsApp está pronto ✅');
});

module.exports = client;
