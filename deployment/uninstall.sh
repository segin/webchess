#!/bin/bash

# WebChess Uninstall Script
# Run as root or with sudo privileges

set -e

WEBCHESS_USER="webchess"
WEBCHESS_HOME="/opt/webchess"
CONFIG_BACKUP_DIR="$HOME/webchess_config_backup_$(date +%Y%m%d_%H%M%S)"

# Source color and formatting functions
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$CURRENT_DIR/colors.sh"

print_header "WebChess Uninstall" "RED"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo"
   exit 1
fi

# Parse arguments
USE_DOCKER=false
for arg in "$@"; do
    if [[ "$arg" == "--docker" ]]; then
        USE_DOCKER=true
    fi
done

if [[ "$USE_DOCKER" == true ]]; then
    print_step "Uninstalling WebChess from Docker..."
    
    # Check for docker-compose
    if command -v docker-compose &>/dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version &>/dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_error "docker-compose or 'docker compose' plugin not found."
        exit 1
    fi

    print_step "Stopping and removing Docker containers..."
    $DOCKER_COMPOSE_CMD down
    
    print_success "WebChess Docker containers removed successfully."
    exit 0
fi

# Confirmation prompt
echo "${BOLD}${RED}⚠ Warning: This will completely remove WebChess and all its files!${RESET}"
echo ""
read -p "${BOLD}Are you sure you want to uninstall WebChess? (y/N): ${RESET}" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Uninstall cancelled."
    exit 0
fi

# Ask about configuration backup
echo ""
read -p "${BOLD}Do you want to backup configuration files before uninstalling? (Y/n): ${RESET}" -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    BACKUP_CONFIG=false
else
    BACKUP_CONFIG=true
fi

# Stop and disable service
if systemctl is-active --quiet webchess 2>/dev/null; then
    print_step "Stopping WebChess service..."
    systemctl stop webchess
fi

if systemctl is-enabled --quiet webchess 2>/dev/null; then
    print_step "Disabling WebChess service..."
    systemctl disable webchess
fi

# Backup configuration if requested
if [[ $BACKUP_CONFIG == true ]] && [[ -d "$WEBCHESS_HOME" ]]; then
    print_step "Backing up configuration to: $CONFIG_BACKUP_DIR"
    mkdir -p "$CONFIG_BACKUP_DIR"
    
    # Backup potential config files
    for config_file in .env config.json; do
        if [[ -f "$WEBCHESS_HOME/$config_file" ]]; then
            cp "$WEBCHESS_HOME/$config_file" "$CONFIG_BACKUP_DIR/"
            print_success "Backed up $config_file"
        fi
    done
    
    # Backup config directory
    if [[ -d "$WEBCHESS_HOME/config" ]]; then
        cp -r "$WEBCHESS_HOME/config" "$CONFIG_BACKUP_DIR/"
        print_success "Backed up config directory"
    fi
fi

# Remove systemd service file
if [[ -f "/etc/systemd/system/webchess.service" ]]; then
    print_step "Removing systemd service file..."
    rm -f /etc/systemd/system/webchess.service
    systemctl daemon-reload
fi

# Remove application directory
if [[ -d "$WEBCHESS_HOME" ]]; then
    print_step "Removing application directory: $WEBCHESS_HOME"
    rm -rf "$WEBCHESS_HOME"
fi

# Ask about removing user
echo ""
read -p "${BOLD}Do you want to remove the system user '$WEBCHESS_USER'? (y/N): ${RESET}" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if id "$WEBCHESS_USER" &>/dev/null; then
        print_step "Removing system user: $WEBCHESS_USER"
        userdel "$WEBCHESS_USER"
    fi
fi

print_completion_box "Uninstall Complete!"

if [[ $BACKUP_CONFIG == true ]] && [[ -d "$CONFIG_BACKUP_DIR" ]]; then
    echo ""
    print_success "Configuration backup saved to: ${WHITE}$CONFIG_BACKUP_DIR${RESET}"
    print_info "You can use these files if you reinstall WebChess later."
fi

echo ""
echo "${BOLD}${YELLOW}📝 Note: This script does not remove:${RESET}"
echo "   ${CYAN}•${RESET} Node.js (if installed)"
echo "   ${CYAN}•${RESET} nginx configuration (if configured)"
echo "   ${CYAN}•${RESET} System packages"
echo ""
echo "${BOLD}${BLUE}🧹 To completely clean up, you may need to manually remove:${RESET}"
echo "   ${CYAN}•${RESET} nginx site configuration in ${WHITE}/etc/nginx/sites-available/${RESET}"
echo "   ${CYAN}•${RESET} nginx site symlinks in ${WHITE}/etc/nginx/sites-enabled/${RESET}"
echo ""