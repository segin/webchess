#!/bin/bash

# WebChess System Installation Script
# Run as root or with sudo privileges

set -e

WEBCHESS_USER="webchess"
WEBCHESS_HOME="/opt/webchess"
CONFIG_BACKUP_DIR="/tmp/webchess_config_backup"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$CURRENT_DIR")"

# Color codes for terminal output
if [[ -t 1 ]] && command -v tput &> /dev/null; then
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    BLUE=$(tput setaf 4)
    MAGENTA=$(tput setaf 5)
    CYAN=$(tput setaf 6)
    WHITE=$(tput setaf 7)
    BOLD=$(tput bold)
    RESET=$(tput sgr0)
else
    RED=""
    GREEN=""
    YELLOW=""
    BLUE=""
    MAGENTA=""
    CYAN=""
    WHITE=""
    BOLD=""
    RESET=""
fi

# Print functions with colors
print_header() {
    echo ""
    echo "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}"
    echo "${BOLD}${CYAN}║                            WebChess Installation                            ║${RESET}"
    echo "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
}

print_step() {
    echo "${BOLD}${BLUE}➤ ${1}${RESET}"
}

print_success() {
    echo "${GREEN}✓ ${1}${RESET}"
}

print_warning() {
    echo "${YELLOW}⚠ ${1}${RESET}"
}

print_error() {
    echo "${RED}✗ ${1}${RESET}"
}

print_info() {
    echo "${CYAN}ℹ ${1}${RESET}"
}

print_header

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo"
   exit 1
fi

# Function to backup configuration files
backup_config() {
    if [[ -d "$WEBCHESS_HOME" ]]; then
        print_step "Backing up existing configuration..."
        mkdir -p "$CONFIG_BACKUP_DIR"
        
        # Backup potential config files
        if [[ -f "$WEBCHESS_HOME/.env" ]]; then
            cp "$WEBCHESS_HOME/.env" "$CONFIG_BACKUP_DIR/"
            print_success "Backed up .env file"
        fi
        
        if [[ -f "$WEBCHESS_HOME/config.json" ]]; then
            cp "$WEBCHESS_HOME/config.json" "$CONFIG_BACKUP_DIR/"
            print_success "Backed up config.json file"
        fi
        
        # Backup any custom nginx configs
        if [[ -d "$WEBCHESS_HOME/config" ]]; then
            cp -r "$WEBCHESS_HOME/config" "$CONFIG_BACKUP_DIR/"
            print_success "Backed up config directory"
        fi
    fi
}

# Function to restore configuration files
restore_config() {
    if [[ -d "$CONFIG_BACKUP_DIR" ]]; then
        print_step "Restoring configuration files..."
        
        if [[ -f "$CONFIG_BACKUP_DIR/.env" ]]; then
            cp "$CONFIG_BACKUP_DIR/.env" "$WEBCHESS_HOME/"
            chown "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME/.env"
            print_success "Restored .env file"
        fi
        
        if [[ -f "$CONFIG_BACKUP_DIR/config.json" ]]; then
            cp "$CONFIG_BACKUP_DIR/config.json" "$WEBCHESS_HOME/"
            chown "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME/config.json"
            print_success "Restored config.json file"
        fi
        
        if [[ -d "$CONFIG_BACKUP_DIR/config" ]]; then
            cp -r "$CONFIG_BACKUP_DIR/config" "$WEBCHESS_HOME/"
            chown -R "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME/config"
            print_success "Restored config directory"
        fi
        
        # Clean up backup
        rm -rf "$CONFIG_BACKUP_DIR"
    fi
}

# Handle existing installation
if [[ -d "$WEBCHESS_HOME" ]]; then
    print_warning "Existing WebChess installation detected"
    
    # Stop service if running
    if systemctl is-active --quiet webchess 2>/dev/null; then
        print_step "Stopping WebChess service..."
        systemctl stop webchess
    fi
    
    # Backup configuration
    backup_config
    
    # Remove old installation (but keep user)
    print_step "Removing old installation..."
    rm -rf "$WEBCHESS_HOME"
fi

# Create system user
print_step "Creating system user: $WEBCHESS_USER"
if ! id "$WEBCHESS_USER" &>/dev/null; then
    useradd --system --shell /bin/false --home "$WEBCHESS_HOME" "$WEBCHESS_USER"
    print_success "User $WEBCHESS_USER created"
else
    print_info "User $WEBCHESS_USER already exists"
fi

# Create application directory
print_step "Setting up application directory: $WEBCHESS_HOME"
mkdir -p "$WEBCHESS_HOME"
chown "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME"

# Copy application files
print_step "Copying application files..."
cp -r "$PROJECT_ROOT"/* "$WEBCHESS_HOME"/
chown -R "$WEBCHESS_USER:$WEBCHESS_USER" "$WEBCHESS_HOME"

# Restore configuration files
restore_config

# Install Node.js dependencies
print_step "Installing Node.js dependencies..."
cd "$WEBCHESS_HOME"
sudo -u "$WEBCHESS_USER" npm install --production

# Install systemd service
print_step "Installing systemd service..."
cp "$WEBCHESS_HOME/deployment/webchess.service" /etc/systemd/system/
systemctl daemon-reload

# Enable and start service
print_step "Enabling and starting WebChess service..."
systemctl enable webchess
systemctl start webchess

# Check service status
print_step "Checking service status..."
sleep 2
if systemctl is-active --quiet webchess; then
    print_success "WebChess service is running successfully"
    print_success "Service will start automatically on boot"
else
    print_error "WebChess service failed to start"
    print_error "Check logs with: journalctl -u webchess -f"
    exit 1
fi

echo ""
echo "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}"
echo "${BOLD}${GREEN}║                          Installation Complete!                             ║${RESET}"
echo "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

echo "${BOLD}${YELLOW}Service Management Commands:${RESET}"
echo "  ${CYAN}Start:${RESET}   ${WHITE}systemctl start webchess${RESET}"
echo "  ${CYAN}Stop:${RESET}    ${WHITE}systemctl stop webchess${RESET}"
echo "  ${CYAN}Restart:${RESET} ${WHITE}systemctl restart webchess${RESET}"
echo "  ${CYAN}Status:${RESET}  ${WHITE}systemctl status webchess${RESET}"
echo "  ${CYAN}Logs:${RESET}    ${WHITE}journalctl -u webchess -f${RESET}"
echo ""

echo "${BOLD}${YELLOW}Configuration:${RESET}"
echo "  ${CYAN}Location:${RESET} ${WHITE}$WEBCHESS_HOME${RESET}"
echo "  ${CYAN}Service:${RESET}  ${WHITE}/etc/systemd/system/webchess.service${RESET}"
echo "  ${CYAN}User:${RESET}     ${WHITE}$WEBCHESS_USER${RESET}"
echo ""

echo "${BOLD}${MAGENTA}🎯 WebChess is now accessible at: ${WHITE}http://localhost:3000${RESET}"
echo ""

echo "${BOLD}${YELLOW}🌐 To set up nginx reverse proxy:${RESET}"
echo "${BOLD}1.${RESET} Install nginx: ${WHITE}apt install nginx${RESET}"
echo "${BOLD}2.${RESET} Use automated setup: ${WHITE}sudo $WEBCHESS_HOME/deployment/setup-nginx.sh -d yourdomain.com${RESET}"
echo ""
echo "${BOLD}   Or manual setup:${RESET}"
echo "   ${CYAN}•${RESET} Copy config: ${WHITE}cp $WEBCHESS_HOME/deployment/nginx.conf /etc/nginx/sites-available/webchess${RESET}"
echo "   ${CYAN}•${RESET} Enable site: ${WHITE}ln -s /etc/nginx/sites-available/webchess /etc/nginx/sites-enabled/${RESET}"
echo "   ${CYAN}•${RESET} Test config: ${WHITE}nginx -t${RESET}"
echo "   ${CYAN}•${RESET} Restart nginx: ${WHITE}systemctl restart nginx${RESET}"
echo ""

echo "${BOLD}${BLUE}💡 To upgrade WebChess in the future, simply run this script again.${RESET}"
echo "${BOLD}${BLUE}   Your configuration files will be preserved automatically.${RESET}"
echo ""