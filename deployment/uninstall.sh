#!/bin/bash

# WebChess Uninstall Script
# Run as root or with sudo privileges

set -e

WEBCHESS_USER="webchess"
WEBCHESS_HOME="/opt/webchess"
CONFIG_BACKUP_DIR="$HOME/webchess_config_backup_$(date +%Y%m%d_%H%M%S)"

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
    echo "${BOLD}${RED}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}"
    echo "${BOLD}${RED}║                            WebChess Uninstall                               ║${RESET}"
    echo "${BOLD}${RED}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}"
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

echo ""
echo "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}"
echo "${BOLD}${GREEN}║                        Uninstall Complete!                                  ║${RESET}"
echo "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

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