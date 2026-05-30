#!/bin/bash

# Directory path variables
APP_DIR="/home/keyain/Documents/antigravity/lively-goodall"
DESKTOP_DIR="/home/keyain/.local/share/applications"
DESKTOP_FILE="pip-ter-3000.desktop"

echo "⚡ Preparing Pip-Ter 3000 build..."
cd "$APP_DIR"
npm run build

echo "⚡ Installing desktop entry to $DESKTOP_DIR..."
mkdir -p "$DESKTOP_DIR"
cp "$APP_DIR/$DESKTOP_FILE" "$DESKTOP_DIR/"
chmod +x "$DESKTOP_DIR/$DESKTOP_FILE"

echo "⚡ Updating desktop database..."
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

echo "✨ Pip-Ter 3000 registered successfully!"
echo "💡 You can now set it as your default terminal emulator in KDE Plasma settings (System Settings -> Default Applications -> Terminal Emulator)."
