const express = require('express');
const { sendMessage } = require('../controllers/sendMessageController');

const router = express.Router();

router.post('/api/v1/send', sendMessage);

module.exports = router;
