#!/bin/bash

# WebChess Uninstall Script
# Run as root or with sudo privileges

set -e

WEBCHESS_USER="webchess"
WEBCHESS_HOME="/opt/webchess"
CONFIG_BACKUP_DIR="$HOME/webchess_config_backup_$(date +%Y%m%d_%H%M%S)"

echo "WebChess Uninstall Script"
echo "========================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo" 
   exit 1
fi

# Confirmation prompt
read -p "Are you sure you want to uninstall WebChess? This will remove all files. (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstall cancelled."
    exit 0
fi

# Ask about configuration backup
read -p "Do you want to backup configuration files before uninstalling? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    BACKUP_CONFIG=false
else
    BACKUP_CONFIG=true
fi

# Stop and disable service
if systemctl is-active --quiet webchess 2>/dev/null; then
    echo "Stopping WebChess service..."
    systemctl stop webchess
fi

if systemctl is-enabled --quiet webchess 2>/dev/null; then
    echo "Disabling WebChess service..."
    systemctl disable webchess
fi

# Backup configuration if requested
if [[ $BACKUP_CONFIG == true ]] && [[ -d "$WEBCHESS_HOME" ]]; then
    echo "Backing up configuration to: $CONFIG_BACKUP_DIR"
    mkdir -p "$CONFIG_BACKUP_DIR"
    
    # Backup potential config files
    for config_file in .env config.json; do
        if [[ -f "$WEBCHESS_HOME/$config_file" ]]; then
            cp "$WEBCHESS_HOME/$config_file" "$CONFIG_BACKUP_DIR/"
            echo "Backed up $config_file"
        fi
    done
    
    # Backup config directory
    if [[ -d "$WEBCHESS_HOME/config" ]]; then
        cp -r "$WEBCHESS_HOME/config" "$CONFIG_BACKUP_DIR/"
        echo "Backed up config directory"
    fi
fi

# Remove systemd service file
if [[ -f "/etc/systemd/system/webchess.service" ]]; then
    echo "Removing systemd service file..."
    rm -f /etc/systemd/system/webchess.service
    systemctl daemon-reload
fi

# Remove application directory
if [[ -d "$WEBCHESS_HOME" ]]; then
    echo "Removing application directory: $WEBCHESS_HOME"
    rm -rf "$WEBCHESS_HOME"
fi

# Ask about removing user
read -p "Do you want to remove the system user '$WEBCHESS_USER'? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if id "$WEBCHESS_USER" &>/dev/null; then
        echo "Removing system user: $WEBCHESS_USER"
        userdel "$WEBCHESS_USER"
    fi
fi

echo ""
echo "WebChess has been successfully uninstalled!"

if [[ $BACKUP_CONFIG == true ]] && [[ -d "$CONFIG_BACKUP_DIR" ]]; then
    echo ""
    echo "Configuration backup saved to: $CONFIG_BACKUP_DIR"
    echo "You can use these files if you reinstall WebChess later."
fi

echo ""
echo "Note: This script does not remove:"
echo "- Node.js (if installed)"
echo "- nginx configuration (if configured)"
echo "- System packages"
echo ""
echo "To completely clean up, you may need to manually remove:"
echo "- nginx site configuration in /etc/nginx/sites-available/"
echo "- nginx site symlinks in /etc/nginx/sites-enabled/"