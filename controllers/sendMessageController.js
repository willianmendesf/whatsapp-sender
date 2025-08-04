const client = require('../services/client');
const logger = require('../utils/logger');

const { MessageMedia } = require('whatsapp-web.js');

const delay = ms => new Promise(res => setTimeout(res, ms));

const fila = [];
let processando = false;
let contadorEnvios = 0;

/**
 * Função principal da fila
 */
function enfileirarMensagem(req, res) {
  fila.push({ req, res });

  if (!processando) {
    processarFila();
  }
}

async function processarFila() {
  processando = true;

  while (fila.length > 0) {
    const { req, res } = fila.shift();
    await sendMessageInternal(req, res);

    contadorEnvios++;

    // Pausa estratégica a cada 10 envios
    if (contadorEnvios % 10 === 0) {
      logger.info("🛑 Pausa estratégica após 10 mensagens...");
      await delay(10000); // 10 segundos
    }

    // Delay entre envios
    const tempoAleatorio = Math.floor(Math.random() * 1500) + 1500;
    await delay(tempoAleatorio);
  }

  processando = false;
}

/**
 * Função que realiza o envio da mensagem individualmente
 */
async function sendMessageInternal(req, res) {
  logger.info("📨 Processando envio...");
  const { type, number, message, media, fallbackList = [], mentions = []} = req.body;

  if (!type || !number || !message) {
    return res.status(400).json({
      error: 'Campos obrigatórios: type, number, message.'
    });
  }

  let chatId;
  if (type === 'individual') {
    chatId = number.includes('@c.us') ? number : `${number}@c.us`;
  } else if (type === 'group') {
    chatId = number.includes('@g.us') ? number : `${number}@g.us`;
  } else {
    return res.status(400).json({ error: 'Tipo inválido. Use "group" ou "individual".' });
  }

  try {
    if (media && media.data && media.type) {
      if (media.type === 'video') {
        return res.status(400).json({
          error: 'Envio de vídeos não é permitido'
        });
      }

      let mediaObject;
      if (media.data.startsWith('http')) {
        mediaObject = await MessageMedia.fromUrl(media.data, {
          filename: media.filename || undefined
        });
      } else {
        const mimeTypes = {
          'image': 'image/jpeg',
          'audio': 'audio/mpeg',
          'document': 'application/pdf'
        };

        const mimeType = mimeTypes[media.type] || 'application/octet-stream';

        mediaObject = new MessageMedia(
          mimeType,
          media.data,
          media.filename || `media.${media.type === 'image' ? 'jpg' : media.type === 'audio' ? 'mp3' : 'file'}`
        );
      }

      await client.sendMessage(chatId, mediaObject, {
        caption: media.caption || message || undefined
      });

      await delay(Math.floor(Math.random() * 1500) + 1500);

      if (message && media.caption) {
        if (mentions && Array.isArray(mentions) && mentions.length > 0) {
          const resolvedMentions = await Promise.all(
            mentions.map(m => client.getContactById(m))
          );
          await client.sendMessage(chatId, message, { mentions: resolvedMentions });
        } 
        
        else await client.sendMessage(chatId, message);
        
        await delay(Math.floor(Math.random() * 1500) + 1500);
      }
    } else {
      if (mentions && Array.isArray(mentions) && mentions.length > 0) {
        const resolvedMentions = await Promise.all(
          mentions.map(m => client.getContactById(m))
        );
        await client.sendMessage(chatId, message, { mentions: resolvedMentions });
      }
      else await client.sendMessage(chatId, message);
  
      await delay(Math.floor(Math.random() * 1500) + 1500);
    }


    res.status(200).json({
      status: `✅ Mensagem${media ? ' com mídia' : ''} enviada com sucesso. Via Tipo ${type}.`
    });
    logger.info('✅ Mensagem enviada com sucesso!');

  } catch (error) {
    logger.error('❌ Erro ao enviar mensagem:', error);

    if (fallbackList && fallbackList.length > 0) {
      let hasValidFallback = false;

      for (const fallback of fallbackList) {
        if (fallback.type && fallback.number) {
          if ((fallback.type === 'individual' || fallback.type === 'group')) {
            const numbers = Array.isArray(fallback.number) ? fallback.number : [fallback.number];
            if (numbers.length > 0 && numbers.some(num => num != null && num != undefined && num.toString().trim() !== '')) {
              hasValidFallback = true;
              break;
            }
          }
        }
      }

      if (hasValidFallback) {
        const results = [];

        for (const fallback of fallbackList) {
          const fallbackType = fallback.type;
          if (!fallbackType || !fallback.number) continue;
          if (fallbackType !== 'individual' && fallbackType !== 'group') continue;

          const fallbackNumbers = Array.isArray(fallback.number) ? fallback.number : [fallback.number];
          if (fallbackNumbers.length === 0) continue;

          for (const fallbackNumber of fallbackNumbers) {
            if (fallbackNumber == null || fallbackNumber == undefined || fallbackNumber.toString().trim() === '') continue;

            let fallbackId;
            if (fallbackType === 'individual') {
              fallbackId = fallbackNumber.includes('@c.us') ? fallbackNumber : `${fallbackNumber}@c.us`;
            } else if (fallbackType === 'group') {
              fallbackId = fallbackNumber.includes('@g.us') ? fallbackNumber : `${fallbackNumber}@g.us`;
            }

            try {
              const errorMessage = `⚠️ ALERTA: Falha no envio de mensagem!\n\nDestino original: ${number}\nTipo: ${type}\nHorário: ${new Date().toLocaleString('pt-BR')}\n\nDetalhes: ${error.message}`;

              await client.sendMessage(fallbackId, errorMessage);
              results.push({ number: fallbackNumber, status: '✅ Notificação de erro enviada' });
            } catch (err) {
              results.push({ number: fallbackNumber, status: '❌ Falha ao enviar notificação' });
            }
          }
        }

        return res.status(207).json({
          error: 'Falha ao enviar mensagem principal.',
          fallbackResults: results,
          message: 'Notificações de erro enviadas para os contatos de fallback.'
        });
      }
    }

    return res.status(500).json({
      error: 'Falha ao enviar mensagem e nenhum fallback configurado.',
      details: error.message
    });
  }
};

/**
 * Função pública que agora só enfileira a mensagem
 */
const sendMessage = async (req, res) => {
  enfileirarMensagem(req, res);
};

module.exports = { sendMessage };