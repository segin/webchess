# WebChess Debian Installation Guide

## Quick Installation on Debian/Ubuntu

### Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.19 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation (should show 22.19.x or higher)
node --version
npm --version

# Ensure Node.js version meets requirements
if [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 22 ]]; then
  echo "Error: Node.js 22.19 or higher is required"
  exit 1
fi
```

### One-Command Installation

```bash
# Clone, install, and start WebChess as a system service
git clone https://github.com/segin/webchess.git
cd webchess
sudo ./deployment/install.sh
```

That's it! WebChess is now running as a systemd service.

### What the installer does:

1. **Creates system user**: `webchess` with no shell access
2. **Installs to**: `/opt/webchess` (standard location for system apps)
3. **Sets up systemd service**: Automatically starts on boot
4. **Configures security**: Restricted permissions and sandboxing
5. **Starts service**: Ready to use immediately

### Verification

```bash
# Check service status
sudo systemctl status webchess

# View live logs
sudo journalctl -u webchess -f

# Test the application
curl http://localhost:3000
```

### Adding Nginx (Recommended)

**Automated Setup (Recommended):**

```bash
# Install nginx
sudo apt install nginx

# Set up WebChess on a subdomain (e.g., chess.yourdomain.com)
sudo /opt/webchess/deployment/setup-nginx.sh -d yourdomain.com

# For custom subdomain:
sudo /opt/webchess/deployment/setup-nginx.sh -d yourdomain.com -s games
```

**Manual Setup:**

```bash
# Install nginx
sudo apt install nginx

# Copy and customize nginx configuration
sudo cp /opt/webchess/deployment/nginx-subdomain.conf /etc/nginx/sites-available/webchess

# Edit the configuration to set your subdomain and domain
sudo nano /etc/nginx/sites-available/webchess
# Change: SUBDOMAIN.DOMAIN.COM
# To:     chess.yourdomain.com (or your preferred subdomain)

# Enable the site
sudo ln -s /etc/nginx/sites-available/webchess /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### SSL Certificate (Optional but Recommended)

```bash
# Install certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate for your subdomain
sudo certbot --nginx -d chess.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Firewall Configuration

```bash
# Install and configure UFW firewall
sudo apt install ufw

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

### Service Management

```bash
# View service status
sudo systemctl status webchess

# Start/stop/restart service
sudo systemctl start webchess
sudo systemctl stop webchess
sudo systemctl restart webchess

# Enable/disable auto-start on boot
sudo systemctl enable webchess
sudo systemctl disable webchess

# View logs
sudo journalctl -u webchess -f          # Live logs
sudo journalctl -u webchess --since today  # Today's logs
sudo journalctl -u webchess -n 100      # Last 100 lines
```

### Configuration

The service runs with these defaults:
- **Port**: 3000 (configurable via `PORT` environment variable)
- **Host**: 127.0.0.1 (configurable via `HOST` environment variable)
- **User**: webchess (system user, no shell access)
- **Working Directory**: /opt/webchess
- **Log Location**: systemd journal (use `journalctl -u webchess`)

To change configuration:

```bash
# Edit systemd service file
sudo systemctl edit webchess

# Add your overrides (example):
[Service]
Environment=PORT=8080
Environment=HOST=0.0.0.0

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart webchess
```

### Troubleshooting

#### Service won't start
```bash
# Check detailed status
sudo systemctl status webchess -l

# View recent logs
sudo journalctl -u webchess -n 50

# Check if port is in use
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000
```

#### Permission issues
```bash
# Fix ownership
sudo chown -R webchess:webchess /opt/webchess

# Check file permissions
ls -la /opt/webchess/
```

#### Node.js issues
```bash
# Verify Node.js installation (must be 22.19 or higher)
node --version
which node

# If Node.js version is too old, reinstall:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Check if Node.js path is correct in service file
cat /etc/systemd/system/webchess.service | grep ExecStart
```

#### Nginx issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify site is enabled
ls -la /etc/nginx/sites-enabled/
```

### Updating WebChess

```bash
# Stop service
sudo systemctl stop webchess

# Backup current installation
sudo cp -r /opt/webchess /opt/webchess.backup.$(date +%Y%m%d)

# Update from git
cd /opt/webchess
sudo -u webchess git pull origin main
sudo -u webchess npm install --production

# Restart service
sudo systemctl start webchess

# Verify update
sudo systemctl status webchess
```

### Uninstalling

```bash
# Stop and disable service
sudo systemctl stop webchess
sudo systemctl disable webchess

# Remove service file
sudo rm /etc/systemd/system/webchess.service
sudo systemctl daemon-reload

# Remove application directory
sudo rm -rf /opt/webchess

# Remove user (optional)
sudo userdel webchess

# Remove nginx configuration (if installed)
sudo rm -f /etc/nginx/sites-enabled/webchess
sudo rm -f /etc/nginx/sites-available/webchess
sudo systemctl restart nginx
```

## System Requirements

- **OS**: Debian 10+ or Ubuntu 18.04+
- **RAM**: 256MB minimum (512MB recommended)
- **Storage**: 100MB for application + logs
- **Network**: Port 3000 (or custom port) accessible
- **Node.js**: Version 22.19 or higher

## Security Features

The systemd service includes security hardening:
- Runs as unprivileged system user
- No new privileges allowed
- Private temporary directory
- Protected system directories
- Home directory protection
- IPC namespace isolation

These settings provide defense-in-depth security for production deployment.