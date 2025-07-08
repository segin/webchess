#!/bin/bash

# WebChess System Installation Script
# Run as root or with sudo privileges

set -e

WEBCHESS_USER="webchess"
WEBCHESS_HOME="/opt/webchess"
CONFIG_BACKUP_DIR="/tmp/webchess_config_backup"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$CURRENT_DIR")"

echo "Installing WebChess as a system service..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo" 
   exit 1
fi

# Function to backup configuration files
backup_config() {
    if [[ -d "$WEBCHESS_HOME" ]]; then
        echo "Backing up existing configuration..."
        mkdir -p "$CONFIG_BACKUP_DIR"
        
        # Backup potential config files
        if [[ -f "$WEBCHESS_HOME/.env" ]]; then
            cp "$WEBCHESS_HOME/.env" "$CONFIG_BACKUP_DIR/"
            echo "Backed up .env file"
        fi
        
        if [[ -f "$WEBCHESS_HOME/config.json" ]]; then
            cp "$WEBCHESS_HOME/config.json" "$CONFIG_BACKUP_DIR/"
            echo "Backed up config.json file"
        fi
        
        # Backup any custom nginx configs
        if [[ -d "$WEBCHESS_HOME/config" ]]; then
            cp -r "$WEBCHESS_HOME/config" "$CONFIG_BACKUP_DIR/"
            echo "Backed up config directory"
        fi
    fi
}

# Function to restore configuration files
restore_config() {
    if [[ -d "$CONFIG_BACKUP_DIR" ]]; then
        echo "Restoring configuration files..."
        
        if [[ -f "$CONFIG_BACKUP_DIR/.env" ]]; then
            cp "$CONFIG_BACKUP_DIR/.env" "$WEBCHESS_HOME/"
            chown "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME/.env"
            echo "Restored .env file"
        fi
        
        if [[ -f "$CONFIG_BACKUP_DIR/config.json" ]]; then
            cp "$CONFIG_BACKUP_DIR/config.json" "$WEBCHESS_HOME/"
            chown "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME/config.json"
            echo "Restored config.json file"
        fi
        
        if [[ -d "$CONFIG_BACKUP_DIR/config" ]]; then
            cp -r "$CONFIG_BACKUP_DIR/config" "$WEBCHESS_HOME/"
            chown -R "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME/config"
            echo "Restored config directory"
        fi
        
        # Clean up backup
        rm -rf "$CONFIG_BACKUP_DIR"
    fi
}

# Handle existing installation
if [[ -d "$WEBCHESS_HOME" ]]; then
    echo "Existing WebChess installation detected"
    
    # Stop service if running
    if systemctl is-active --quiet webchess 2>/dev/null; then
        echo "Stopping WebChess service..."
        systemctl stop webchess
    fi
    
    # Backup configuration
    backup_config
    
    # Remove old installation (but keep user)
    echo "Removing old installation..."
    rm -rf "$WEBCHESS_HOME"
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

# Restore configuration files
restore_config

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
echo "Configuration:"
echo "  Location: $WEBCHESS_HOME"
echo "  Service:  /etc/systemd/system/webchess.service"
echo "  User:     $WEBCHESS_USER"
echo ""
echo "WebChess is now accessible at: http://localhost:3000"
echo ""
echo "To set up nginx reverse proxy:"
echo "1. Install nginx: apt install nginx"
echo "2. Use automated setup: sudo $WEBCHESS_HOME/deployment/setup-nginx.sh -d yourdomain.com"
echo "   Or manual setup:"
echo "   - Copy config: cp $WEBCHESS_HOME/deployment/nginx.conf /etc/nginx/sites-available/webchess"
echo "   - Enable site: ln -s /etc/nginx/sites-available/webchess /etc/nginx/sites-enabled/"
echo "   - Test config: nginx -t"
echo "   - Restart nginx: systemctl restart nginx"
echo ""
echo "To upgrade WebChess in the future, simply run this script again."
echo "Your configuration files will be preserved automatically."