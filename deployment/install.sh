#!/bin/bash

# WebChess System Installation Script
# Run as root or with sudo privileges

set -e

WEBCHESS_USER="webchess"
WEBCHESS_HOME="/opt/webchess"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$CURRENT_DIR")"

echo "Installing WebChess as a system service..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo" 
   exit 1
fi

# Create system user
echo "Creating system user: $WEBCHESS_USER"
if ! id "$WEBCHESS_USER" &>/dev/null; then
    useradd --system --shell /bin/false --home "$WEBCHESS_HOME" "$WEBCHESS_USER"
    echo "User $WEBCHESS_USER created"
else
    echo "User $WEBCHESS_USER already exists"
fi

# Create application directory
echo "Setting up application directory: $WEBCHESS_HOME"
mkdir -p "$WEBCHESS_HOME"
chown "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME"

# Copy application files
echo "Copying application files..."
cp -r "$PROJECT_ROOT"/* "$WEBCHESS_HOME"/
chown -R "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME"

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd "$WEBCHESS_HOME"
sudo -u "$WEBCHESS_USER" npm install --production

# Install systemd service
echo "Installing systemd service..."
cp "$WEBCHESS_HOME/deployment/webchess.service" /etc/systemd/system/
systemctl daemon-reload

# Enable and start service
echo "Enabling and starting WebChess service..."
systemctl enable webchess
systemctl start webchess

# Check service status
echo "Checking service status..."
sleep 2
if systemctl is-active --quiet webchess; then
    echo "✓ WebChess service is running successfully"
    echo "✓ Service will start automatically on boot"
else
    echo "✗ WebChess service failed to start"
    echo "Check logs with: journalctl -u webchess -f"
    exit 1
fi

echo ""
echo "Installation complete!"
echo ""
echo "Service management commands:"
echo "  Start:   systemctl start webchess"
echo "  Stop:    systemctl stop webchess"
echo "  Restart: systemctl restart webchess"
echo "  Status:  systemctl status webchess"
echo "  Logs:    journalctl -u webchess -f"
echo ""
echo "WebChess is now accessible at: http://localhost:3000"
echo ""
echo "To set up nginx reverse proxy:"
echo "1. Install nginx: apt install nginx"
echo "2. Copy config: cp $WEBCHESS_HOME/deployment/nginx.conf /etc/nginx/sites-available/webchess"
echo "3. Enable site: ln -s /etc/nginx/sites-available/webchess /etc/nginx/sites-enabled/"
echo "4. Test config: nginx -t"
echo "5. Restart nginx: systemctl restart nginx"