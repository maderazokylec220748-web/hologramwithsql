#!/bin/bash

# Deployment script for WIS AI Hologram Assistant
# Run this script on your Linux VPS

set -e  # Exit on any error

echo "🚀 Starting deployment of WIS AI Hologram Assistant..."

# Configuration
APP_NAME="wis-ai-hologram"
APP_DIR="/var/www/$APP_NAME"
SERVICE_NAME="$APP_NAME.service"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$APP_NAME"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20.x if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install MySQL if not installed
if ! command -v mysql &> /dev/null; then
    echo "📦 Installing MySQL..."
    apt install -y mysql-server
    mysql_secure_installation
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt install -y nginx
fi

# Install PM2 globally for process management
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create app directory
echo "📁 Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Copy files (assuming you've uploaded them)
echo "📋 Files should be in $APP_DIR"
echo "   Use: scp -r /path/to/hologramwithsql/* user@your-vps:$APP_DIR/"

# Install dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install --production=false
    
    # Build the application
    echo "🔨 Building application..."
    npm run build
    
    # Setup database
    echo "🗄️  Setting up database..."
    npm run db:setup
else
    echo "⚠️  package.json not found. Please upload your files first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env template..."
    cat > .env << 'EOF'
# Database configuration
DATABASE_URL=mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/hologram
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=YOUR_MYSQL_PASSWORD
DATABASE_NAME=hologram

# Groq API configuration
GROQ_API_KEY=your_groq_api_key_here

# Server configuration
PORT=5001
NODE_ENV=production

# Session secret (GENERATE A RANDOM SECRET)
SESSION_SECRET=$(openssl rand -hex 64)

# Data Retention Policy
QUERY_RETENTION_DAYS=7
CHAT_RETENTION_DAYS=7
ANALYTICS_RETENTION_DAYS=30
FEEDBACK_RETENTION_DAYS=90

# Production domain (optional)
ALLOWED_ORIGINS=https://your-domain.com
EOF
    echo "⚠️  Please edit .env file and add your configuration"
    echo "   nano $APP_DIR/.env"
fi

# Create MySQL database
echo "🗄️  Creating MySQL database..."
mysql -u root -p << 'MYSQL_SCRIPT'
CREATE DATABASE IF NOT EXISTS hologram;
CREATE USER IF NOT EXISTS 'hologram_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON hologram.* TO 'hologram_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
MYSQL_SCRIPT

# Setup PM2 to run the app
echo "🔧 Setting up PM2..."
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# Create Nginx configuration
echo "🌐 Creating Nginx configuration..."
cat > $NGINX_CONF << 'NGINX_CONFIG'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Change this to your domain
    
    client_max_body_size 100M;

    # Redirect to HTTPS (after SSL is setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# HTTPS configuration (uncomment after SSL setup)
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com www.your-domain.com;
#     
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#     
#     location / {
#         proxy_pass http://localhost:5001;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 86400;
#     }
# }
NGINX_CONFIG

# Enable Nginx site
ln -sf $NGINX_CONF $NGINX_ENABLED

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Setup firewall
echo "🔒 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit configuration: nano $APP_DIR/.env"
echo "   2. Update Nginx domain: nano $NGINX_CONF"
echo "   3. Restart services: pm2 restart $APP_NAME && systemctl restart nginx"
echo "   4. Setup SSL: certbot --nginx -d your-domain.com"
echo "   5. Check logs: pm2 logs $APP_NAME"
echo ""
echo "🌐 Your app should be running at: http://$(hostname -I | awk '{print $1}')"
echo ""
