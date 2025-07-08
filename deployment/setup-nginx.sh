#!/bin/bash

# WebChess Nginx Setup Script
# Configures nginx with a subdomain for WebChess

set -e

# Default values
SUBDOMAIN="chess"
DOMAIN=""
CONFIG_NAME="webchess"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 -d DOMAIN [-s SUBDOMAIN] [-n CONFIG_NAME]"
    echo ""
    echo "Options:"
    echo "  -d DOMAIN      Your domain name (required) - e.g., example.com"
    echo "  -s SUBDOMAIN   Subdomain for WebChess (default: chess) - e.g., chess.example.com"
    echo "  -n CONFIG_NAME Name for nginx config file (default: webchess)"
    echo "  -h             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -d example.com"
    echo "  $0 -d example.com -s games"
    echo "  $0 -d mydomain.net -s chess -n my-chess-site"
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
            echo -e "${RED}Invalid option: -$OPTARG${NC}" >&2
            print_usage
            exit 1
            ;;
        :)
            echo -e "${RED}Option -$OPTARG requires an argument.${NC}" >&2
            print_usage
            exit 1
            ;;
    esac
done

# Check if domain is provided
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: Domain is required.${NC}"
    print_usage
    exit 1
fi

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}" 
   exit 1
fi

FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"
CONFIG_FILE="${SITES_AVAILABLE}/${CONFIG_NAME}"

echo -e "${BLUE}Setting up nginx for WebChess...${NC}"
echo "Domain: ${FULL_DOMAIN}"
echo "Config: ${CONFIG_FILE}"
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}nginx is not installed. Installing...${NC}"
    apt update
    apt install -y nginx
fi

# Check if config already exists
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}Configuration file already exists: $CONFIG_FILE${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Aborted.${NC}"
        exit 1
    fi
fi

# Create nginx configuration from template
echo -e "${BLUE}Creating nginx configuration...${NC}"
cp /opt/webchess/deployment/nginx-subdomain.conf "$CONFIG_FILE"

# Replace placeholders in the configuration
sed -i "s/SUBDOMAIN\.DOMAIN\.COM/${FULL_DOMAIN}/g" "$CONFIG_FILE"

echo -e "${GREEN}✓ Configuration created: $CONFIG_FILE${NC}"

# Enable the site
echo -e "${BLUE}Enabling site...${NC}"
if [ -L "${SITES_ENABLED}/${CONFIG_NAME}" ]; then
    echo -e "${YELLOW}Site already enabled${NC}"
else
    ln -s "$CONFIG_FILE" "${SITES_ENABLED}/"
    echo -e "${GREEN}✓ Site enabled${NC}"
fi

# Test nginx configuration
echo -e "${BLUE}Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ nginx configuration test failed${NC}"
    exit 1
fi

# Reload nginx
echo -e "${BLUE}Reloading nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ nginx reloaded${NC}"

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "WebChess is now accessible at: http://${FULL_DOMAIN}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Make sure your DNS points ${FULL_DOMAIN} to this server"
echo "2. Test the site: curl -H 'Host: ${FULL_DOMAIN}' http://localhost"
echo "3. Set up SSL certificate:"
echo "   certbot --nginx -d ${FULL_DOMAIN}"
echo ""
echo -e "${YELLOW}Configuration file location:${NC}"
echo "  ${CONFIG_FILE}"
echo ""
echo -e "${YELLOW}To remove this configuration:${NC}"
echo "  rm ${SITES_ENABLED}/${CONFIG_NAME}"
echo "  rm ${CONFIG_FILE}"
echo "  systemctl reload nginx"