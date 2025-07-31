# Exemplos de Uso da API com Mídia

## Envio de Imagem com Caption

```json
POST /send
{
  "type": "individual",
  "number": "5511999999999",
  "message": "Texto adicional após a imagem",
  "media": {
    "type": "image",
    "data": "https://example.com/image.jpg",
    "filename": "minha-imagem.jpg",
    "caption": "Esta é uma imagem de exemplo"
  }
}
```

## Envio de Documento PDF usando Base64

```json
POST /send
{
  "type": "group",
  "number": "120363419667302902",
  "message": "Confira este documento!",
  "media": {
    "type": "document",
    "data": "data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo...",
    "filename": "documento.pdf"
  }
}
```

## Envio de Documento PDF

```json
POST /send
{
  "type": "individual",
  "number": "5511888888888",
  "message": "Documento anexado",
  "media": {
    "type": "document",
    "data": "https://example.com/document.pdf",
    "filename": "relatorio.pdf"
  }
}
```

## Envio de Áudio

```json
POST /send
{
  "type": "individual",
  "number": "5511777777777",
  "message": "Mensagem de áudio",
  "media": {
    "type": "audio",
    "data": "data:audio/mpeg;base64,SUQzBAAAAAABdlRYWFgAAAAQAAAAVGl0bGU...",
    "filename": "audio.mp3"
  }
}
```

## Envio com Fallback incluindo Mídia

```json
POST /send
{
  "type": "individual",
  "number": "5511999999999",
  "message": "Mensagem importante com imagem!",
  "media": {
    "type": "image",
    "data": "https://example.com/alert.png",
    "caption": "ALERTA SISTEMA"
  },
  "fallbackList": [
    { "type": "group", "number": "12034567890" },
    { "type": "individual", "number": "5511988888888" }
  ]
}
```

## Comportamento da Mídia

1. **Ordem de Envio**: A mídia é sempre enviada PRIMEIRO, depois o texto (se aplicável)
2. **Caption vs Mensagem**: 
   - Se `media.caption` está presente, será usado como legenda da mídia
   - Se há `message` E `media.caption`, a mensagem será enviada separadamente após a mídia
   - Se só há `message`, será usado como legenda da mídia
3. **Tipos Suportados**: image, audio, document (❌ vídeos não permitidos)
4. **Formatos de Data**: 
   - URL completa (http/https)
   - Base64 string (com ou sem prefixo data:)
5. **Fallback**: Em caso de falha no envio principal, a mídia também será enviada para todos os números de fallback

## Tipos MIME Padrão

- **image**: image/jpeg
- **audio**: audio/mpeg
- **document**: application/pdf

**Nota**: Vídeos não são suportados por questões de segurança/política.

Para outros tipos específicos, você pode precisar ajustar o código conforme necessário.
