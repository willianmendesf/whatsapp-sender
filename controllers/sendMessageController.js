const client = require('../services/client');

/**
 * Example
 * {
      "type": "individual",
      "number": "5511999999999",
      "message": "Alerta: falha no canal principal!",
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
  const { type, number, message, fallbackList = [] } = req.body;

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
    await client.sendMessage(chatId, message);
    var sended = res.status(200).json({
      status: `✅ Mensagem enviada com sucesso para ${type}.`
    });
    console.log('✅ Mensagem enviada com sucesso!')
    return sended;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);

    // 🌀 Tentativa de envio para fallback
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
        await client.sendMessage(fallbackId, message);
        results.push({ number: fallbackNumber, status: '✅ Mensagem enviada' });
      } catch (err) {
        results.push({ number: fallbackNumber, status: '❌ Falha ao enviar' });
      }
    }

    return res.status(207).json({
      error: 'Falha ao enviar mensagem principal.',
      fallbackResults: results
    });
  }
};

module.exports = { sendMessage };
