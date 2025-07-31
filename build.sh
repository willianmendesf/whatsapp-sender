#!/bin/bash

# Lê nome e versão do package.json
APP_NAME=$(jq -r '.name' package.json)
APP_VERSION=$(jq -r '.version' package.json)

# Define nomes
FOLDER_NAME="${APP_NAME}-v${APP_VERSION}"
ZIP_NAME="${FOLDER_NAME}.zip"
TARGET_DIR="target"

# Remove pasta target se existir e recria
rm -rf "$TARGET_DIR"
mkdir "$TARGET_DIR"

# Cria pasta temporária com nome-versão
mkdir "$FOLDER_NAME"
rsync -av --exclude="$FOLDER_NAME" --exclude="node_modules" --exclude="$ZIP_NAME" ./ "$FOLDER_NAME/"

# Comprime a pasta e move para target
zip -r "$ZIP_NAME" "$FOLDER_NAME"
mv "$ZIP_NAME" "$TARGET_DIR/"

# Limpa pasta temporária
rm -rf "$FOLDER_NAME"

echo "Aplicação comprimida e salva em: $TARGET_DIR/$ZIP_NAME"
