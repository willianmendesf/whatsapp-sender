const client = require('../services/client');
const { MessageMedia } = require('whatsapp-web.js');

/**
 * Função auxiliar para processar e enviar mídia
 * @param {string} chatId - ID do chat de destino
 * @param {object} mediaData - Dados da mídia
 * @param {string} message - Mensagem de texto (opcional)
 * @returns {Promise} - Resultado do envio
 */
async function sendMediaMessage(chatId, mediaData, message) {
  try {
    // Verificar se o tipo de mídia é permitido (não permitir vídeo)
    if (mediaData.type === 'video') {
      throw new Error('Envio de vídeos não é permitido');
    }
    
    let media;
    
    // Se os dados da mídia contêm uma URL
    if (mediaData.data.startsWith('http')) {
      media = await MessageMedia.fromUrl(mediaData.data, {
        filename: mediaData.filename || undefined
      });
    } 
    // Se os dados da mídia são base64
    else {
      const mimeTypes = {
        'image': 'image/jpeg',
        'audio': 'audio/mpeg',
        'document': 'application/pdf'
      };
      
      const mimeType = mimeTypes[mediaData.type] || 'application/octet-stream';
      
      media = new MessageMedia(
        mimeType,
        mediaData.data,
        mediaData.filename || `media.${mediaData.type === 'image' ? 'jpg' : mediaData.type === 'audio' ? 'mp3' : 'file'}`
      );
    }
    
    // Enviar mídia primeiro
    await client.sendMessage(chatId, media, {
      caption: mediaData.caption || message || undefined
    });
    
    // Se há mensagem adicional e não foi usada como caption, enviar separadamente
    if (message && mediaData.caption) {
      await client.sendMessage(chatId, message);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar mídia:', error);
    throw error;
  }
}

/**
 * Example
 * {
      "type": "individual",
      "number": "5511999999999",
      "message": "Alerta: falha no canal principal!",
      "media": {
        "type": "image|audio|document",
        "data": "base64_string_or_url",
        "filename": "optional_filename.jpg",
        "caption": "optional_caption"
      },
      "fallbackList": [
        { "type": "group", "number": "12034567890" },
        { "type": "individual", "number": "5511988888888" }
      ]
    }
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */

const sendMessage = async (req, res) => {
  console.log("Iniciando envio!")
  const { type, number, message, media, fallbackList = [] } = req.body;

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
    // Verificar se há mídia para enviar
    if (media && media.data && media.type) {
      await sendMediaMessage(chatId, media, message);
    } else {
      // Enviar apenas mensagem de texto
      await client.sendMessage(chatId, message);
    }
    
    var sended = res.status(200).json({
      status: `✅ Mensagem${media ? ' com mídia' : ''} enviada com sucesso. Via Tipo ${type}.`
    });
    console.log('✅ Mensagem enviada com sucesso!')
    return sended;

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);

    // 🌀 Tentativa de envio para fallback (apenas se fallbackList não estiver vazia)
    if (fallbackList && fallbackList.length > 0) {
      const results = [];

      for (const fallback of fallbackList) {
        let fallbackId;
        const fallbackType = fallback.type;
        const fallbackNumber = fallback.number;

        if (fallbackType === 'individual') {
          if(fallbackNumber == null || fallbackNumber == undefined) 
            fallbackId = "5511966152161@c.us"
          else 
            fallbackId = fallbackNumber.includes('@c.us') ? fallbackNumber : `${fallbackNumber}@c.us`;
        } else if (fallbackType === 'group') {
          if(fallbackNumber == null || fallbackNumber == undefined) 
            fallbackId = "120363419667302902@g.us"
          else 
            fallbackId = fallbackNumber.includes('@g.us') ? fallbackNumber : `${fallbackNumber}@g.us`;
        } else {
          results.push({ number: fallbackNumber, status: 'Tipo inválido' });
          continue;
        }

        try {
          // Verificar se há mídia para enviar no fallback
          if (media && media.data && media.type) {
            await sendMediaMessage(fallbackId, media, message);
          } else {
            await client.sendMessage(fallbackId, message);
          }
          results.push({ number: fallbackNumber, status: '✅ Mensagem enviada' });
        } catch (err) {
          results.push({ number: fallbackNumber, status: '❌ Falha ao enviar' });
        }
      }

      return res.status(207).json({
        error: 'Falha ao enviar mensagem principal.',
        fallbackResults: results
      });
    } else {
      // Se não há fallback, apenas retorna o erro
      return res.status(500).json({
        error: 'Falha ao enviar mensagem e nenhum fallback configurado.',
        details: error.message
      });
    }
  }
};

module.exports = { sendMessage };
