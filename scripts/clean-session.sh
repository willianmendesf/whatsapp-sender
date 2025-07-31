#!/bin/bash

echo "🧹 Limpando sessão do WhatsApp Web..."

# Para o processo se estiver rodando
pkill -f "node.*app.js" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

# Remove arquivos de sessão
rm -rf ./.wwebjs_auth
rm -rf ./.wwebjs_cache
rm -f ./public/qr.png

echo "✅ Sessão limpa! Execute 'npm start' para reconectar."
