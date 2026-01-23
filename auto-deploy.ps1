# Simple VPS Deployment Script
# Edit configuration, then run: powershell -ExecutionPolicy Bypass -File .\auto-deploy.ps1

param(
    [string]$VPS_IP = "your-vps-ip",
    [string]$VPS_USER = "root",
    [string]$MYSQL_PASS = "your-mysql-password",
    [string]$GROQ_KEY = "your-groq-api-key",
    [string]$DOMAIN = "your-domain-or-ip"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   WIS AI Hologram - Auto Deploy" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Validate config
if ($VPS_IP -eq "your-vps-ip") {
    Write-Host "ERROR: Edit this script first!" -ForegroundColor Red
    Write-Host "Open: notepad auto-deploy.ps1" -ForegroundColor Yellow
    Write-Host "Change the param() values at the top`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/7] Preparing files..." -ForegroundColor Yellow
$buildDir = "build-deploy"
if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
New-Item -ItemType Directory -Path $buildDir | Out-Null

# Copy project files
@("server","client","shared","migrations","scripts","config","package.json","package-lock.json","tsconfig.json","vite.config.ts","tailwind.config.ts","postcss.config.js","drizzle.config.ts","ecosystem.config.js") | ForEach-Object {
    if (Test-Path $_) {
        Copy-Item -Path $_ -Destination "$buildDir\" -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Create .env
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
@"
DATABASE_URL=mysql://root:$MYSQL_PASS@localhost:3306/hologram
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=$MYSQL_PASS
DATABASE_NAME=hologram
GROQ_API_KEY=$GROQ_KEY
PORT=5001
NODE_ENV=production
SESSION_SECRET=$secret
QUERY_RETENTION_DAYS=7
CHAT_RETENTION_DAYS=7
ANALYTICS_RETENTION_DAYS=30
FEEDBACK_RETENTION_DAYS=90
ALLOWED_ORIGINS=https://$DOMAIN,http://$DOMAIN
"@ | Out-File "$buildDir\.env" -Encoding UTF8
Write-Host "  + Files prepared" -ForegroundColor Green
Write-Host ""

Write-Host "[2/7] Uploading to VPS..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "mkdir -p /tmp/deploy"
scp -r -o StrictHostKeyChecking=no "$buildDir\*" "${VPS_USER}@${VPS_IP}:/tmp/deploy/"
Write-Host "  + Upload complete" -ForegroundColor Green
Write-Host ""

Write-Host "[3/7] Installing dependencies..." -ForegroundColor Yellow
$installScript = @"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl wget nginx mysql-server
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs
npm install -g pm2
systemctl start mysql nginx
systemctl enable mysql nginx
"@
ssh "$VPS_USER@$VPS_IP" $installScript
Write-Host "  + Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "[4/7] Configuring database..." -ForegroundColor Yellow
$dbScript = "mysql -u root -e `"ALTER USER 'root'@'localhost' IDENTIFIED BY '$MYSQL_PASS'; CREATE DATABASE IF NOT EXISTS hologram; FLUSH PRIVILEGES;`""
ssh "$VPS_USER@$VPS_IP" $dbScript
Write-Host "  + Database configured" -ForegroundColor Green
Write-Host ""

Write-Host "[5/7] Building application..." -ForegroundColor Yellow
$buildScript = @"
mkdir -p /var/www/wis-ai-hologram
cp -r /tmp/deploy/* /var/www/wis-ai-hologram/
cd /var/www/wis-ai-hologram
npm install
npm run build
npm run db:setup
"@
ssh "$VPS_USER@$VPS_IP" $buildScript
Write-Host "  + Build complete" -ForegroundColor Green
Write-Host ""

Write-Host "[6/7] Starting application..." -ForegroundColor Yellow
$startScript = @"
cd /var/www/wis-ai-hologram
pm2 delete wis-ai-hologram 2>/dev/null; true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash
"@
ssh "$VPS_USER@$VPS_IP" $startScript
Write-Host "  + Application started" -ForegroundColor Green
Write-Host "" 

Write-Host "[7/7] Configuring Nginx..." -ForegroundColor Yellow
$nginxConf = @"
server {
    listen 80;
    server_name $DOMAIN $VPS_IP;
    client_max_body_size 100M;
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        proxy_read_timeout 86400;
    }
}
"@
$nginxConf | Out-File "$buildDir\nginx-conf" -Encoding UTF8
scp -o StrictHostKeyChecking=no "$buildDir\nginx-conf" "${VPS_USER}@${VPS_IP}:/etc/nginx/sites-available/wis-ai-hologram"
$nginxSetup = @"
ln -sf /etc/nginx/sites-available/wis-ai-hologram /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
"@
ssh "$VPS_USER@$VPS_IP" $nginxSetup
Write-Host "  + Nginx configured" -ForegroundColor Green
Write-Host ""

Remove-Item $buildDir -Recurse -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is running at:" -ForegroundColor Yellow
Write-Host "  http://$VPS_IP" -ForegroundColor Cyan
if ($DOMAIN -ne "your-domain.com") {
    Write-Host "  http://$DOMAIN" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs: ssh $VPS_USER@$VPS_IP 'pm2 logs wis-ai-hologram'" -ForegroundColor White
Write-Host "  Restart:   ssh $VPS_USER@$VPS_IP 'pm2 restart wis-ai-hologram'" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
