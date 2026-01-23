# Quick Deployment Guide

## Method 1: Automated (Recommended)

### On Windows:

1. **Edit upload script** with your VPS details:
   ```powershell
   notepad upload-to-vps.ps1
   ```
   Change:
   - `$VPS_USER = "root"` (your VPS username)
   - `$VPS_IP = "your-vps-ip"` (your VPS IP address)

2. **Run upload script**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File upload-to-vps.ps1
   ```

### On Linux VPS:

3. **Run deployment**:
   ```bash
   cd /tmp/hologram
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

4. **Configure environment**:
   ```bash
   sudo nano /var/www/wis-ai-hologram/.env
   ```
   Update:
   - `GROQ_API_KEY` (get from https://console.groq.com/keys)
   - `DATABASE_PASSWORD` (your MySQL password)
   - `ALLOWED_ORIGINS` (your domain)

5. **Update domain**:
   ```bash
   sudo nano /etc/nginx/sites-available/wis-ai-hologram
   ```
   Change `your-domain.com` to your actual domain

6. **Restart services**:
   ```bash
   sudo pm2 restart wis-ai-hologram
   sudo systemctl restart nginx
   ```

7. **Setup SSL** (optional but recommended):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Method 2: Manual Upload

1. **Compress files** (PowerShell):
   ```powershell
   Compress-Archive -Path * -DestinationPath hologram.zip
   ```

2. **Upload to VPS**:
   ```powershell
   scp hologram.zip root@your-vps-ip:/tmp/
   ```

3. **SSH and extract**:
   ```bash
   ssh root@your-vps-ip
   cd /tmp
   unzip hologram.zip -d hologram
   cd hologram
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

4. Follow steps 4-7 from Method 1

## Common Issues

### SSH Connection Issues
```bash
# Generate SSH key (if needed)
ssh-keygen -t rsa -b 4096

# Copy to VPS
ssh-copy-id root@your-vps-ip
```

### Port Issues
```bash
# Check what's using port
sudo lsof -i :5001

# Kill process if needed
sudo kill -9 <PID>
```

### MySQL Connection Issues
```bash
# Reset MySQL password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;

# Update .env with new password
sudo nano /var/www/wis-ai-hologram/.env
```

## Check Status

```bash
# Application status
pm2 status

# View logs
pm2 logs wis-ai-hologram

# Nginx status
sudo systemctl status nginx

# MySQL status
sudo systemctl status mysql
```

## Your Application URLs

- **HTTP**: http://your-vps-ip
- **HTTPS** (after SSL): https://your-domain.com
- **Logs**: `/var/www/wis-ai-hologram/logs/`

## Need Help?

See detailed instructions in `DEPLOYMENT.md`
