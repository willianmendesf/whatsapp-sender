const express = require('express');
const client = require('./services/whatsappClient');
const sendRoute = require('./routes/sendRoute');

const port = 3200;

const app = express();
app.use(express.json());

app.use('/api/v1', sendRoute);

client.initialize();

app.listen(port, () => {
  console.log(`Rodando na porta ${port} 🚀`);
});
