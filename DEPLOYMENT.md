# Deployment Guide - WIS AI Hologram Assistant

## Prerequisites

- Linux VPS (Ubuntu 20.04+ or Debian 11+ recommended)
- Root/sudo access
- Domain name (optional but recommended)
- At least 2GB RAM
- At least 20GB storage

## Quick Deployment

### Step 1: Upload Files to VPS

```bash
# On your local machine (Windows)
# Replace 'user' and 'your-vps-ip' with your actual credentials

# Using SCP
scp -r C:\Users\kimkl\hologramwithsql\* user@your-vps-ip:/tmp/hologram/

# Or zip and upload
# (In PowerShell on Windows)
Compress-Archive -Path C:\Users\kimkl\hologramwithsql\* -DestinationPath hologram.zip
scp hologram.zip user@your-vps-ip:/tmp/
```

### Step 2: SSH into Your VPS

```bash
ssh user@your-vps-ip
```

### Step 3: Run Deployment Script

```bash
# Move to tmp directory
cd /tmp

# Extract if you uploaded zip
unzip hologram.zip -d hologram/

# Make deployment script executable
cd hologram
chmod +x deploy.sh

# Run deployment script
sudo ./deploy.sh
```

### Step 4: Configure Environment

```bash
# Edit .env file
sudo nano /var/www/wis-ai-hologram/.env

# Update these values:
# - DATABASE_PASSWORD (your MySQL password)
# - GROQ_API_KEY (from https://console.groq.com/keys)
# - ALLOWED_ORIGINS (your domain)
```

### Step 5: Update MySQL Database Password

```bash
# Login to MySQL
sudo mysql -u root -p

# Run these commands:
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
FLUSH PRIVILEGES;
EXIT;
```

### Step 6: Configure Nginx Domain

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/wis-ai-hologram

# Change 'your-domain.com' to your actual domain
# Save and exit (Ctrl+X, Y, Enter)

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Restart Application

```bash
# Restart PM2 process
cd /var/www/wis-ai-hologram
sudo pm2 restart wis-ai-hologram

# Check status
sudo pm2 status

# View logs
sudo pm2 logs wis-ai-hologram
```

## SSL Certificate Setup (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts and select option 2 (Redirect HTTP to HTTPS)

# Test auto-renewal
sudo certbot renew --dry-run
```

## Manual Installation (Alternative)

If you prefer manual setup without the script:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Setup Application

```bash
# Create directory
sudo mkdir -p /var/www/wis-ai-hologram
cd /var/www/wis-ai-hologram

# Copy your files here
# Then install dependencies
sudo npm install

# Build application
sudo npm run build

# Setup environment
sudo cp .env.production .env
sudo nano .env  # Edit configuration
```

### 3. Setup MySQL Database

```bash
sudo mysql -u root -p

# In MySQL shell:
CREATE DATABASE hologram;
CREATE USER 'hologram_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON hologram.* TO 'hologram_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
sudo npm run db:setup
```

### 4. Setup PM2

```bash
# Start application
sudo pm2 start npm --name "wis-ai-hologram" -- start

# Or use ecosystem config
sudo pm2 start ecosystem.config.js

# Save PM2 configuration
sudo pm2 save

# Setup PM2 to start on boot
sudo pm2 startup systemd
```

### 5. Configure Nginx

Create `/etc/nginx/sites-available/wis-ai-hologram`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/wis-ai-hologram /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Useful Commands

```bash
# View application logs
pm2 logs wis-ai-hologram

# Restart application
pm2 restart wis-ai-hologram

# Stop application
pm2 stop wis-ai-hologram

# Check application status
pm2 status

# Monitor resources
pm2 monit

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart Nginx
sudo systemctl restart nginx

# Check MySQL status
sudo systemctl status mysql

# View MySQL logs
sudo tail -f /var/log/mysql/error.log
```

## Updating the Application

```bash
# Upload new files
scp -r /path/to/updated/files/* user@your-vps:/var/www/wis-ai-hologram/

# SSH into VPS
ssh user@your-vps-ip

# Navigate to app directory
cd /var/www/wis-ai-hologram

# Install new dependencies
sudo npm install

# Rebuild
sudo npm run build

# Run migrations if needed
sudo npm run db:setup

# Restart application
sudo pm2 restart wis-ai-hologram
```

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs wis-ai-hologram

# Check .env file is configured
cat .env

# Rebuild application
npm run build
pm2 restart wis-ai-hologram
```

### Database connection errors

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test MySQL connection
mysql -u root -p hologram

# Check database credentials in .env
nano .env
```

### Nginx errors

```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx is running
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Port already in use

```bash
# Check what's using port 5001
sudo lsof -i :5001

# Kill process if needed
sudo kill -9 <PID>

# Restart application
pm2 restart wis-ai-hologram
```

## Security Checklist

- [ ] Changed default MySQL password
- [ ] Generated random SESSION_SECRET
- [ ] Setup firewall (UFW)
- [ ] Installed SSL certificate
- [ ] Configured ALLOWED_ORIGINS in .env
- [ ] Setup regular backups
- [ ] Enabled automatic security updates
- [ ] Setup monitoring/alerts

## Backup Strategy

```bash
# Backup database
mysqldump -u root -p hologram > backup_$(date +%Y%m%d).sql

# Backup .env file
sudo cp /var/www/wis-ai-hologram/.env ~/env_backup_$(date +%Y%m%d)

# Setup automated daily backups (cron)
sudo crontab -e

# Add this line for daily backup at 2 AM:
0 2 * * * mysqldump -u root -pYOUR_PASSWORD hologram > /backups/hologram_$(date +\%Y\%m\%d).sql
```

## Monitoring

```bash
# Install monitoring tool (optional)
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Setup log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Support

For issues or questions:
- Check application logs: `pm2 logs wis-ai-hologram`
- Check server logs: `sudo journalctl -xe`
- Review this deployment guide
- Check MySQL connection and credentials
