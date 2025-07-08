#!/bin/bash

# WebChess Nginx Setup Script
# Configures nginx with a subdomain for WebChess

set -e

# Default values
SUBDOMAIN="chess"
DOMAIN=""
CONFIG_NAME="webchess"

# Source color and formatting functions
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$CURRENT_DIR/colors.sh"

print_usage() {
    echo "${BOLD}Usage:${RESET} $0 -d DOMAIN [-s SUBDOMAIN] [-n CONFIG_NAME]"
    echo ""
    echo "${BOLD}Options:${RESET}"
    echo "  ${CYAN}-d DOMAIN${RESET}      Your domain name (required) - e.g., example.com"
    echo "  ${CYAN}-s SUBDOMAIN${RESET}   Subdomain for WebChess (default: chess) - e.g., chess.example.com"
    echo "  ${CYAN}-n CONFIG_NAME${RESET} Name for nginx config file (default: webchess)"
    echo "  ${CYAN}-h${RESET}             Show this help message"
    echo ""
    echo "${BOLD}Examples:${RESET}"
    echo "  ${WHITE}$0 -d example.com${RESET}"
    echo "  ${WHITE}$0 -d example.com -s games${RESET}"
    echo "  ${WHITE}$0 -d mydomain.net -s chess -n my-chess-site${RESET}"
}

# Parse command line arguments
while getopts "d:s:n:h" opt; do
    case $opt in
        d)
            DOMAIN="$OPTARG"
            ;;
        s)
            SUBDOMAIN="$OPTARG"
            ;;
        n)
            CONFIG_NAME="$OPTARG"
            ;;
        h)
            print_usage
            exit 0
            ;;
        \?)
            print_error "Invalid option: -$OPTARG"
            print_usage
            exit 1
            ;;
        :)
            print_error "Option -$OPTARG requires an argument."
            print_usage
            exit 1
            ;;
    esac
done

# Check if domain is provided
if [ -z "$DOMAIN" ]; then
    print_error "Domain is required."
    print_usage
    exit 1
fi

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo"
   exit 1
fi

FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"
CONFIG_FILE="${SITES_AVAILABLE}/${CONFIG_NAME}"

print_header "WebChess Nginx Setup"
echo "${BOLD}${YELLOW}Domain:${RESET} ${WHITE}${FULL_DOMAIN}${RESET}"
echo "${BOLD}${YELLOW}Config:${RESET} ${WHITE}${CONFIG_FILE}${RESET}"
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_warning "nginx is not installed. Installing..."
    apt update
    apt install -y nginx
fi

# Check if config already exists
if [ -f "$CONFIG_FILE" ]; then
    print_warning "Configuration file already exists: $CONFIG_FILE"
    read -p "${BOLD}Do you want to overwrite it? (y/N): ${RESET}" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted."
        exit 1
    fi
fi

# Create nginx configuration from template
print_step "Creating nginx configuration..."
cp /opt/webchess/deployment/nginx-subdomain.conf "$CONFIG_FILE"

# Replace placeholders in the configuration
sed -i "s/SUBDOMAIN\.DOMAIN\.COM/${FULL_DOMAIN}/g" "$CONFIG_FILE"

print_success "Configuration created: $CONFIG_FILE"

# Enable the site
print_step "Enabling site..."
if [ -L "${SITES_ENABLED}/${CONFIG_NAME}" ]; then
    print_warning "Site already enabled"
else
    ln -s "$CONFIG_FILE" "${SITES_ENABLED}/"
    print_success "Site enabled"
fi

# Test nginx configuration
print_step "Testing nginx configuration..."
if nginx -t; then
    print_success "nginx configuration is valid"
else
    print_error "nginx configuration test failed"
    exit 1
fi

# Reload nginx
print_step "Reloading nginx..."
systemctl reload nginx
print_success "nginx reloaded"

print_completion_box "Setup Complete!"

echo "${BOLD}${MAGENTA}🌐 WebChess is now accessible at: ${WHITE}http://${FULL_DOMAIN}${RESET}"
echo ""

echo "${BOLD}${YELLOW}📋 Next steps:${RESET}"
echo "${BOLD}1.${RESET} Make sure your DNS points ${WHITE}${FULL_DOMAIN}${RESET} to this server"
echo "${BOLD}2.${RESET} Test the site: ${WHITE}curl -H 'Host: ${FULL_DOMAIN}' http://localhost${RESET}"
echo "${BOLD}3.${RESET} Set up SSL certificate:"
echo "   ${WHITE}certbot --nginx -d ${FULL_DOMAIN}${RESET}"
echo ""

echo "${BOLD}${YELLOW}📁 Configuration file location:${RESET}"
echo "  ${WHITE}${CONFIG_FILE}${RESET}"
echo ""

echo "${BOLD}${YELLOW}🗑️ To remove this configuration:${RESET}"
echo "  ${WHITE}rm ${SITES_ENABLED}/${CONFIG_NAME}${RESET}"
echo "  ${WHITE}rm ${CONFIG_FILE}${RESET}"
echo "  ${WHITE}systemctl reload nginx${RESET}"
echo ""