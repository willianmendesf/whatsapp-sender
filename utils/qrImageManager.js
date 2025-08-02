const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const logger = require('./logger');

class QRImageManager {
  constructor() {
    this.qrPath = path.join(__dirname, '..', 'public', 'qr.png');
    this.connected = false;
    this.error = null;
    this.lastQRGenerated = null;
  }

  async generate(qrText) {
    try {
      await QRCode.toFile(this.qrPath, qrText, {
        type: 'png',
        width: 300,
        margin: 2
      });
      this.lastQRGenerated = new Date();
      this.error = null;
      logger.info('📸 Imagem do QR gerada em:', this.qrPath);
    } catch (err) {
      this.error = err.message;
      logger.error('❌ Erro ao gerar imagem do QR:', err);
    }
  }

  exists() {
    return fs.existsSync(this.qrPath);
  }

  setConnected(status) {
    this.connected = status;
    if (status) {
      this.error = null;
    }
  }

  isConnected() {
    return this.connected;
  }

  hasError() {
    return this.error !== null;
  }

  getError() {
    return this.error;
  }

  setError(error) {
    this.error = error;
    this.connected = false;
  }

  clearSession() {
    try {
      if (this.exists()) {
        fs.unlinkSync(this.qrPath);
      }
      this.connected = false;
      this.error = null;
      this.lastQRGenerated = null;
      return true;
    } catch (err) {
      logger.error('Erro ao limpar sessão:', err);
      return false;
    }
  }

  getLatestQRPath() {
    if (this.exists()) {
      return this.qrPath;
    }
    return null;
  }

  getLastQRGenerated() {
    return this.lastQRGenerated;
  }

  getHTML() {
    if (this.connected) {
      return `
        <html>
          <head>
            <meta http-equiv="refresh" content="5; url=/status.html">
            <title>WhatsApp Bot - Conectado</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                text-align: center; 
                background: linear-gradient(135deg, #25D366, #128C7E);
                color: white;
                padding: 50px;
                margin: 0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              h1 { font-size: 2.5em; margin-bottom: 20px; }
              p { font-size: 1.2em; margin-bottom: 30px; }
              a { 
                color: white; 
                text-decoration: none; 
                background: rgba(255,255,255,0.2);
                padding: 15px 30px;
                border-radius: 10px;
                border: 2px solid white;
                transition: all 0.3s;
              }
              a:hover { background: rgba(255,255,255,0.3); }
            </style>
          </head>
          <body>
            <h1>✅ Bot Conectado!</h1>
            <p>O WhatsApp foi conectado com sucesso.</p>
            <p>Redirecionando para a tela de status...</p>
            <a href="/status.html">🔄 Ir para Status Agora</a>
          </body>
        </html>
      `;
    }

    if (!this.exists()) {
      return `
        <html>
          <head>
            <meta http-equiv="refresh" content="5">
            <title>WhatsApp Bot - Gerando QR</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                text-align: center; 
                background: linear-gradient(135deg, #34495e, #2c3e50);
                color: white;
                padding: 50px;
                margin: 0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              h1 { font-size: 2.5em; margin-bottom: 20px; }
              p { font-size: 1.2em; margin-bottom: 30px; }
              .spinner {
                border: 4px solid rgba(255,255,255,0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <h1>⌛ Gerando QR Code...</h1>
            <div class="spinner"></div>
            <p>Aguarde enquanto a imagem do QR é gerada.</p>
            <p>A página será atualizada automaticamente.</p>
          </body>
        </html>
      `;
    }

    return `
      <html>
        <head>
          <meta http-equiv="refresh" content="5">
          <title>WhatsApp Bot - Login</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              text-align: center; 
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              padding: 20px;
              margin: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            h1 { font-size: 2.5em; margin-bottom: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            p { font-size: 1.2em; margin-bottom: 20px; }
            img { 
              max-width: 300px; 
              border: 5px solid white; 
              border-radius: 15px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              margin: 20px;
            }
            .qr-container {
              position: relative;
              display: inline-block;
            }
            .loading-overlay {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(255,255,255,0.95);
              padding: 10px 20px;
              border-radius: 10px;
              font-size: 1em;
              color: #333;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              pointer-events: none;
              z-index: 10;
            }
            .qr-status {
              margin-bottom: 10px;
              font-size: 0.9em;
              opacity: 0.8;
            }
            .instructions {
              background: rgba(255,255,255,0.1);
              padding: 20px;
              border-radius: 10px;
              margin-top: 20px;
              border: 1px solid rgba(255,255,255,0.2);
            }
            .step {
              margin: 10px 0;
              font-size: 1.1em;
            }
            .refresh-info {
              margin-top: 30px;
              font-size: 0.9em;
              opacity: 0.8;
            }
            .status-info {
              background: rgba(255,255,255,0.1);
              padding: 15px;
              border-radius: 10px;
              margin-bottom: 20px;
              font-size: 0.9em;
            }
          </style>
          <script>
            // Verifica se a imagem carregou
            function checkQRImage() {
              const img = document.getElementById('qr-image');
              const overlay = document.getElementById('loading-overlay');
              const status = document.getElementById('qr-status');
              
              if (!img || !overlay) return;
              
              // Se a imagem já carregou, mostra ela
              if (img.complete && img.naturalWidth > 0) {
                img.style.display = 'block';
                overlay.style.display = 'none';
                if (status) status.innerHTML = '✅ QR Code pronto para escaneamento';
                return;
              }
              
              img.onload = function() {
                console.log('QR Image loaded successfully');
                img.style.display = 'block';
                overlay.style.display = 'none';
                if (status) status.innerHTML = '✅ QR Code pronto para escaneamento';
              };
              
              img.onerror = function() {
                console.log('QR Image failed to load, retrying...');
                if (status) status.innerHTML = '⏳ Gerando QR Code...';
                // Tenta novamente em 2 segundos
                setTimeout(() => {
                  img.src = '/qr.png?t=' + Date.now();
                }, 2000);
              };
              
              // Timeout de segurança - se depois de 10 segundos não carregou, tenta forçar
              setTimeout(() => {
                if (img.style.display === 'none') {
                  img.style.display = 'block';
                  overlay.style.display = 'none';
                  if (status) status.innerHTML = '⚠️ QR pode não estar disponível - tente recarregar a página';
                }
              }, 10000);
            }
            
            // Executa quando a página carrega
            document.addEventListener('DOMContentLoaded', checkQRImage);
            window.onload = checkQRImage;
            
            // Tenta recarregar a imagem a cada 5 segundos se não carregou
            setInterval(() => {
              const img = document.getElementById('qr-image');
              const status = document.getElementById('qr-status');
              
              if (img && img.style.display === 'none') {
                if (status) status.innerHTML = '🔄 Tentando carregar QR Code...';
                img.src = '/qr.png?t=' + Date.now();
              }
            }, 5000);
          </script>
        </head>
        <body>
          <h1>📱 WhatsApp Bot Login</h1>
          
          <div class="status-info">
            ⏱️ QR Code ${this.lastQRGenerated ? 'gerado em ' + this.lastQRGenerated.toLocaleTimeString() : 'sendo gerado...'}
          </div>
          
          <div class="qr-status" id="qr-status">
            🔄 Carregando QR Code...
          </div>
          
          <div class="qr-container">
            <img id="qr-image" src="/qr.png?t=${Date.now()}" alt="QR Code do WhatsApp" style="display: none;" />
            <div id="loading-overlay" class="loading-overlay" style="position: static; transform: none; margin: 20px;">
              ⏳ Aguarde...
            </div>
          </div>
          
          <div class="instructions">
            <div class="step">1. 📱 Abra o WhatsApp no seu celular</div>
            <div class="step">2. 👆 Toque nos três pontos (Android) ou Configurações (iPhone)</div>
            <div class="step">3. 🔗 Selecione "Aparelhos conectados"</div>
            <div class="step">4. 📷 Escaneie o código QR acima</div>
          </div>
          
          <div class="refresh-info">
            🔄 Esta página será atualizada automaticamente a cada 5 segundos
          </div>
          
          ${this.hasError() ? `
            <div style="
              background: rgba(255,0,0,0.2);
              border: 1px solid rgba(255,0,0,0.5);
              padding: 15px;
              border-radius: 10px;
              margin-top: 20px;
            ">
              <p>⚠️ Problema detectado: ${this.getError()}</p>
              <a href="/clear-session" style="
                background: rgba(255,0,0,0.3);
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 5px;
                border: 1px solid rgba(255,0,0,0.5);
              ">🧹 Limpar Sessão</a>
            </div>
          ` : ''}
        </body>
      </html>
    `;
  }
}

module.exports = new QRImageManager();
