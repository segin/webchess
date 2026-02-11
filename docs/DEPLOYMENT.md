# WebChess Deployment Guide

## System Requirements

- Node.js 16 or higher
- npm (comes with Node.js)
- systemd (for daemon service)
- nginx (for reverse proxy)

## Installation

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/segin/webchess.git
cd webchess
npm install
```

### 2. Test the Application

```bash
# Start the server
npm start

# Test in another terminal
curl http://localhost:3000
```

## System Daemon Setup

### 1. Create System User

```bash
# Create a dedicated user for the service
sudo useradd --system --shell /bin/false --home /opt/webchess webchess

# Create application directory
sudo mkdir -p /opt/webchess
sudo chown webchess:webchess /opt/webchess

# Copy application files
sudo cp -r . /opt/webchess/
sudo chown -R webchess:webchess /opt/webchess

# Install dependencies as the webchess user
sudo -u webchess npm install --production --prefix /opt/webchess
```

### 2. Create systemd Service File

Create `/etc/systemd/system/webchess.service`:

```ini
[Unit]
Description=WebChess - Two-Player Online Chess System
Documentation=https://github.com/segin/webchess
After=network.target

[Service]
Type=simple
User=webchess
Group=webchess
WorkingDirectory=/opt/webchess
ExecStart=/usr/bin/node src/server/index.js
Restart=always
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=webchess

# Environment variables
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=127.0.0.1

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/webchess
ProtectHome=true
RemoveIPC=true

[Install]
WantedBy=multi-user.target
```

### 3. Enable and Start Service

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable webchess

# Start the service
sudo systemctl start webchess

# Check status
sudo systemctl status webchess

# View logs
sudo journalctl -u webchess -f
```

### 4. Service Management Commands

```bash
# Start service
sudo systemctl start webchess

# Stop service
sudo systemctl stop webchess

# Restart service
sudo systemctl restart webchess

# Reload service (graceful restart)
sudo systemctl reload webchess

# Check service status
sudo systemctl status webchess

# View logs
sudo journalctl -u webchess -f

# View logs from last boot
sudo journalctl -u webchess -b

# View logs with timestamps
sudo journalctl -u webchess -o short-precise
```

## Nginx Configuration

### 1. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
# or
sudo dnf install nginx
```

### 2. Create Nginx Configuration

Create `/etc/nginx/sites-available/webchess`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ package\.json$ {
        deny all;
    }
}
```

### 3. Enable Site and Restart Nginx

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/webchess /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

### 4. SSL/HTTPS Setup (Optional but Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is typically set up automatically
# Test auto-renewal
sudo certbot renew --dry-run
```

## Environment Configuration

Create `/opt/webchess/.env` for environment-specific settings:

```bash
# Server configuration
NODE_ENV=production
PORT=3000
HOST=127.0.0.1

# Optional: Database settings (if added later)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=webchess
# DB_USER=webchess
# DB_PASS=your_password

# Optional: Redis settings (if added later)
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

Update the systemd service file to load the environment file:

```ini
[Service]
# ... other settings ...
EnvironmentFile=/opt/webchess/.env
```

## Firewall Configuration

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Monitoring and Maintenance

### Log Rotation

Create `/etc/logrotate.d/webchess`:

```
/var/log/webchess/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0640 webchess webchess
    postrotate
        systemctl reload webchess
    endscript
}
```

### Health Check Script

Create `/opt/webchess/health-check.sh`:

```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000)
if [ $response -eq 200 ]; then
    echo "WebChess is healthy"
    exit 0
else
    echo "WebChess is unhealthy (HTTP $response)"
    exit 1
fi
```

```bash
chmod +x /opt/webchess/health-check.sh
```

### Backup Script

Create `/opt/webchess/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/webchess/backups"
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf "$BACKUP_DIR/webchess_$DATE.tar.gz" \
    --exclude="node_modules" \
    --exclude="backups" \
    --exclude="*.log" \
    /opt/webchess/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "webchess_*.tar.gz" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo netstat -tlnp | grep :3000
   sudo lsof -i :3000
   ```

2. **Permission denied**
   ```bash
   sudo chown -R webchess:webchess /opt/webchess
   sudo chmod +x /opt/webchess/src/server/index.js
   ```

3. **Service won't start**
   ```bash
   sudo journalctl -u webchess -f
   sudo systemctl status webchess
   ```

4. **Nginx configuration issues**
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

### Performance Tuning

1. **Increase file descriptor limits** in `/etc/security/limits.conf`:
   ```
   webchess soft nofile 65536
   webchess hard nofile 65536
   ```

2. **Optimize Node.js memory usage** in systemd service:
   ```ini
   Environment=NODE_OPTIONS="--max-old-space-size=512"
   ```

3. **Enable nginx worker processes** in `/etc/nginx/nginx.conf`:
   ```nginx
   worker_processes auto;
   worker_connections 1024;
   ```

## Updates and Maintenance

### Updating WebChess

```bash
# Stop the service
sudo systemctl stop webchess

# Backup current version
sudo cp -r /opt/webchess /opt/webchess.backup.$(date +%Y%m%d)

# Update code
cd /opt/webchess
sudo -u webchess git pull origin main
sudo -u webchess npm install --production

# Restart service
sudo systemctl start webchess
```

### Monitoring Resource Usage

```bash
# View system resource usage
top -p $(pgrep -f "node.*webchess")

# Monitor service resource usage
sudo systemctl show webchess --property=MainPID
sudo cat /proc/$(sudo systemctl show webchess --property=MainPID --value)/status
```