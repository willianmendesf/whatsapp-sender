const client = require('../services/client');
const { MessageMedia } = require('whatsapp-web.js');

/**
 * Envia mensagem (texto e/ou mídia) para WhatsApp
 * Example JSON:
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
        { "type": "individual", "number": ["5511988888888", "5511977777777"] },
        { "type": "group", "number": ["120363419667302902", "120363419667302903"] }
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
      // Verificar se o tipo de mídia é permitido (não permitir vídeo)
      if (media.type === 'video') {
        return res.status(400).json({
          error: 'Envio de vídeos não é permitido'
        });
      }
      
      let mediaObject;
      
      // Se os dados da mídia contêm uma URL
      if (media.data.startsWith('http')) {
        mediaObject = await MessageMedia.fromUrl(media.data, {
          filename: media.filename || undefined
        });
      } 
      // Se os dados da mídia são base64
      else {
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
      
      // Enviar mídia com caption (se houver)
      await client.sendMessage(chatId, mediaObject, {
        caption: media.caption || message || undefined
      });
      
      // Se há mensagem adicional e não foi usada como caption, enviar separadamente
      if (message && media.caption) {
        await client.sendMessage(chatId, message);
      }
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

    // 🌀 Tentativa de envio para fallback (apenas se fallbackList estiver válido)
    if (fallbackList && fallbackList.length > 0) {
      // Validar se o fallbackList tem estrutura válida
      let hasValidFallback = false;
      
      for (const fallback of fallbackList) {
        if (fallback.type && fallback.number) {
          // Verificar se é individual ou group com números válidos
          if ((fallback.type === 'individual' || fallback.type === 'group')) {
            const numbers = Array.isArray(fallback.number) ? fallback.number : [fallback.number];
            if (numbers.length > 0 && numbers.some(num => num != null && num != undefined && num.toString().trim() !== '')) {
              hasValidFallback = true;
              break;
            }
          }
        }
      }
      
      // Só processa fallback se houver pelo menos um item válido
      if (hasValidFallback) {
        const results = [];

        for (const fallback of fallbackList) {
          const fallbackType = fallback.type;
          
          // Pular se não tem type ou number válidos
          if (!fallbackType || !fallback.number) {
            continue;
          }
          
          // Pular se o type não é válido
          if (fallbackType !== 'individual' && fallbackType !== 'group') {
            continue;
          }
          
          const fallbackNumbers = Array.isArray(fallback.number) ? fallback.number : [fallback.number];
          
          // Pular se não tem números válidos
          if (fallbackNumbers.length === 0) {
            continue;
          }

          for (const fallbackNumber of fallbackNumbers) {
            // Pular números vazios/nulos
            if (fallbackNumber == null || fallbackNumber == undefined || fallbackNumber.toString().trim() === '') {
              continue;
            }
            
            let fallbackId;

            if (fallbackType === 'individual') {
              fallbackId = fallbackNumber.includes('@c.us') ? fallbackNumber : `${fallbackNumber}@c.us`;
            } else if (fallbackType === 'group') {
              fallbackId = fallbackNumber.includes('@g.us') ? fallbackNumber : `${fallbackNumber}@g.us`;
            }

            try {
              // Enviar notificação padrão de erro para o fallback
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
    
    // Se não há fallback válido, apenas retorna o erro
    return res.status(500).json({
      error: 'Falha ao enviar mensagem e nenhum fallback configurado.',
      details: error.message
    });
  }
};

module.exports = { sendMessage };
