# WebChess Deployment Files

This directory contains configuration files and scripts for deploying WebChess as a system service.

## Files Overview

### Core Files
- **`webchess.service`** - systemd service configuration
- **`install.sh`** - Automated installation script for system setup

### Nginx Configuration
- **`nginx-subdomain.conf`** - Template for subdomain-based nginx setup
- **`setup-nginx.sh`** - Automated nginx configuration script
- **`nginx.conf`** - Legacy config (kept for compatibility)

## Quick Setup

### 1. Install WebChess as System Service
```bash
sudo ./install.sh
```

### 2. Set Up Nginx Subdomain (Recommended)
```bash
# Basic setup - creates chess.yourdomain.com
sudo ./setup-nginx.sh -d yourdomain.com

# Custom subdomain - creates games.yourdomain.com  
sudo ./setup-nginx.sh -d yourdomain.com -s games

# Custom config name
sudo ./setup-nginx.sh -d yourdomain.com -s chess -n my-chess-site
```

## Nginx Setup Script Options

The `setup-nginx.sh` script supports these options:

| Option | Description | Example |
|--------|-------------|---------|
| `-d DOMAIN` | Your domain name (required) | `-d example.com` |
| `-s SUBDOMAIN` | Subdomain for WebChess (default: chess) | `-s games` |
| `-n CONFIG_NAME` | Nginx config file name (default: webchess) | `-n chess-game` |
| `-h` | Show help message | |

## Configuration Templates

### nginx-subdomain.conf
- **Purpose**: Template for subdomain-based nginx configuration
- **Placeholders**: `SUBDOMAIN.DOMAIN.COM` (replaced by setup script)
- **Features**: 
  - HTTP/HTTPS support (HTTPS section commented out)
  - WebSocket support for Socket.IO
  - Security headers
  - Static file caching
  - Gzip compression

### webchess.service
- **Purpose**: systemd service definition
- **User**: Runs as `webchess` system user
- **Security**: Hardened with various protection settings
- **Environment**: Production defaults (PORT=3000, HOST=127.0.0.1)

## Manual Configuration

### Systemd Service
```bash
# Copy service file
sudo cp webchess.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable webchess
sudo systemctl start webchess
```

### Nginx (Manual)
```bash
# Copy template
sudo cp nginx-subdomain.conf /etc/nginx/sites-available/webchess

# Edit placeholders
sudo sed -i 's/SUBDOMAIN\.DOMAIN\.COM/chess.yourdomain.com/g' /etc/nginx/sites-available/webchess

# Enable site
sudo ln -s /etc/nginx/sites-available/webchess /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate Setup

After nginx configuration:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate for your subdomain
sudo certbot --nginx -d chess.yourdomain.com

# Enable HTTPS redirect (uncomment in nginx config)
sudo nano /etc/nginx/sites-available/webchess
# Uncomment the HTTPS server block and HTTP redirect
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change PORT in systemd service environment
2. **Permission errors**: Check file ownership (`chown -R webchess:webchess /opt/webchess`)
3. **Nginx conflicts**: Ensure subdomain doesn't conflict with existing sites
4. **DNS issues**: Verify subdomain DNS points to your server

### Useful Commands

```bash
# Check service status
sudo systemctl status webchess

# View service logs
sudo journalctl -u webchess -f

# Test nginx config
sudo nginx -t

# List enabled nginx sites
ls -la /etc/nginx/sites-enabled/

# Check if port is in use
sudo netstat -tlnp | grep :3000
```

## Directory Structure After Installation

```
/opt/webchess/           # Application directory
├── src/                 # Source code
├── public/              # Static files
├── deployment/          # These config files
└── node_modules/        # Dependencies

/etc/systemd/system/
└── webchess.service     # Service definition

/etc/nginx/sites-available/
└── webchess             # Nginx configuration

/etc/nginx/sites-enabled/
└── webchess -> ../sites-available/webchess
```

## Security Considerations

The deployment includes several security measures:

### systemd Service Security
- Runs as unprivileged `webchess` user
- No new privileges allowed
- Private temporary directory
- Protected system directories
- Home directory protection

### Nginx Security
- Security headers (XSS, CSRF, etc.)
- Sensitive file blocking
- Rate limiting ready (add if needed)
- SSL/TLS support

### Recommendations
- Use HTTPS in production
- Keep Node.js and dependencies updated
- Monitor logs regularly
- Use firewall (UFW) to limit access
- Consider fail2ban for additional protection