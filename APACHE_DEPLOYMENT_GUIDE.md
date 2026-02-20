# Apache Deployment Guide - Production Server

This guide provides step-by-step instructions for deploying the Audit Monitoring System to a production Apache server with subdirectory access.

## Architecture Overview

- **Next.js** runs as a Node.js server on port 3000 (or custom port)
- **Apache** acts as a reverse proxy
- **Access URL**: `http://[server-ip]/audit-monitoring/`

---

## Prerequisites

Ensure your server has:

- **Node.js 18+** and npm
- **MySQL 8.0+**
- **Apache 2.4+** with mod_proxy and mod_proxy_http enabled
- **PM2** (for process management)
- **Git** (for code deployment)

---

## STEP 1: Install Required Apache Modules

```bash
# Enable required Apache modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers

# Restart Apache to apply changes
sudo systemctl restart apache2
```

---

## STEP 2: Install Node.js and PM2 (if not installed)

```bash
# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally for process management
sudo npm install -g pm2
```

---

## STEP 3: Prepare Deployment Directory

```bash
# Navigate to Apache web root
cd /var/www/html

# Create application directory (replace 'audit-monitoring' with your preferred folder name)
sudo mkdir -p audit-monitoring
sudo chown -R $USER:$USER audit-monitoring
cd audit-monitoring
```

---

## STEP 4: Deploy Application Files

### Option A: Using Git (Recommended)

```bash
# Clone your repository
git clone <your-repository-url> .

# Or if you have a local repository
# rsync or scp your files to the server
```

### Option B: Manual Copy

```bash
# From your local machine, copy files to server:
# scp -r /path/to/audit-monitoring/* user@server-ip:/var/www/html/audit-monitoring/
```

---

## STEP 5: Setup MySQL Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE audit_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user (recommended for production)
CREATE USER 'audit_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON audit_monitoring.* TO 'audit_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
cd /var/www/html/audit-monitoring
mysql -u root -p audit_monitoring < database/schema.sql

# Verify tables
mysql -u root -p audit_monitoring -e "SHOW TABLES;"
```

---

## STEP 6: Configure Environment Variables

```bash
# Create .env file in application directory
cd /var/www/html/audit-monitoring
nano .env
```

### Production .env Configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=audit_user
DB_PASSWORD=your_secure_password
DB_NAME=audit_monitoring

# JWT Configuration
JWT_SECRET=your_very_long_random_secret_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# Email Configuration (adjust for your email provider)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=Audit Monitoring System <noreply@yourcompany.com>

# Admin Email
ADMIN_EMAIL=admin@yourcompany.com

# Application URL - IMPORTANT: Set to your production URL
APP_URL=http://your-server-ip/audit-monitoring

# Base Path for subdirectory deployment
BASE_PATH=/audit-monitoring

# File Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760

# Node Environment
NODE_ENV=production

# Server Port (Next.js will run on this port)
PORT=3000
```

**Important Notes:**

- Replace `your-server-ip` with your actual server IP
- Replace `/audit-monitoring` with your chosen folder name
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- For Gmail, use an App Password (not your regular password)

---

## STEP 7: Install Dependencies and Build Application

```bash
cd /var/www/html/audit-monitoring

# Install production dependencies
npm install --production=false

# Build the application
npm run build

# Verify build completed successfully
ls -la .next
```

---

## STEP 8: Setup File Upload Directory Permissions

```bash
cd /var/www/html/audit-monitoring

# Create uploads directory if not exists
mkdir -p public/uploads/findings

# Set proper permissions
chmod -R 755 public/uploads
chown -R $USER:$USER public/uploads

# For Apache access (if needed)
sudo chown -R www-data:www-data public/uploads
```

---

## STEP 9: Configure Apache Virtual Host / Site Configuration

Edit your Apache configuration file:

```bash
# For default site
sudo nano /etc/apache2/sites-available/000-default.conf

# Or create a new site configuration
sudo nano /etc/apache2/sites-available/audit-monitoring.conf
```

### Apache Configuration:

```apache
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    # Reverse Proxy Configuration for audit-monitoring
    <Location /audit-monitoring>
        ProxyPreserveHost On
        ProxyPass http://localhost:3000/audit-monitoring
        ProxyPassReverse http://localhost:3000/audit-monitoring

        # WebSocket support (if needed)
        RewriteEngine on
        RewriteCond %{HTTP:Upgrade} websocket [NC]
        RewriteCond %{HTTP:Connection} upgrade [NC]
        RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
    </Location>

    # Allow access to uploads directory
    <Location /audit-monitoring/_next>
        ProxyPass http://localhost:3000/audit-monitoring/_next
        ProxyPassReverse http://localhost:3000/audit-monitoring/_next
    </Location>

    # Existing applications configurations...
    # (keep your other app configurations here)

</VirtualHost>
```

**If you created a new configuration file:**

```bash
# Enable the site
sudo a2ensite audit-monitoring.conf

# Test Apache configuration
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2
```

---

## STEP 10: Start Application with PM2

```bash
cd /var/www/html/audit-monitoring

# Start the application using PM2
pm2 start npm --name "audit-monitoring" -- start

# Start the cron job
pm2 start npm --name "audit-cron" -- run cron

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the command it outputs (usually requires sudo)

# Check application status
pm2 status
pm2 logs audit-monitoring
```

---

## STEP 11: Configure Firewall (if applicable)

```bash
# If using UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

# Make sure port 3000 is NOT exposed externally
# It should only be accessible internally for Apache proxy
```

---

## STEP 12: Verify Deployment

1. **Check Application Status:**

   ```bash
   pm2 status
   pm2 logs audit-monitoring --lines 50
   ```

2. **Test Node.js Server Directly:**

   ```bash
   curl http://localhost:3000/audit-monitoring
   ```

3. **Test Apache Proxy:**

   ```bash
   curl http://localhost/audit-monitoring
   ```

4. **Access from Browser:**
   - Open: `http://[your-server-ip]/audit-monitoring/`
   - You should see the login page

5. **Check Apache Logs if issues occur:**
   ```bash
   sudo tail -f /var/apache2/logs/error.log
   ```

---

## STEP 13: Create Default Admin User

```bash
# Connect to the database
mysql -u audit_user -p audit_monitoring

# Check if admin user exists
SELECT * FROM users WHERE email = 'admin@company.com';

# If no admin user, you need to create one through the application
# or insert directly (password: 'admin123' - CHANGE IMMEDIATELY!)

# Example: Insert admin user with hashed password
# Note: Use the application to create users properly
```

---

## Maintenance Commands

### View Application Logs:

```bash
pm2 logs audit-monitoring
pm2 logs audit-cron
```

### Restart Application:

```bash
pm2 restart audit-monitoring
pm2 restart audit-cron
```

### Stop Application:

```bash
pm2 stop audit-monitoring
pm2 stop audit-cron
```

### Update Application:

```bash
cd /var/www/html/audit-monitoring

# Stop application
pm2 stop audit-monitoring

# Pull latest changes (if using git)
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Restart application
pm2 restart audit-monitoring

# Check status
pm2 logs audit-monitoring --lines 50
```

### Database Backup:

```bash
# Create backup
mysqldump -u audit_user -p audit_monitoring > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u audit_user -p audit_monitoring < backup_20240221_120000.sql
```

---

## Troubleshooting

### Issue 1: 502 Bad Gateway

**Cause:** Node.js server is not running or wrong port
**Solution:**

```bash
pm2 status
pm2 restart audit-monitoring
pm2 logs audit-monitoring
```

### Issue 2: Static files (CSS/JS) not loading

**Cause:** BASE_PATH configuration mismatch
**Solution:**

- Verify `.env` has `BASE_PATH=/audit-monitoring`
- Rebuild: `npm run build`
- Restart: `pm2 restart audit-monitoring`

### Issue 3: Database connection errors

**Cause:** Wrong credentials or MySQL not accessible
**Solution:**

```bash
# Test database connection
mysql -u audit_user -p -h localhost audit_monitoring -e "SELECT 1;"

# Check .env file database settings
cat .env | grep DB_
```

### Issue 4: File upload errors

**Cause:** Permission issues
**Solution:**

```bash
sudo chown -R www-data:www-data /var/www/html/audit-monitoring/public/uploads
sudo chmod -R 755 /var/www/html/audit-monitoring/public/uploads
```

### Issue 5: Can't access application externally

**Cause:** Firewall blocking port 80
**Solution:**

```bash
sudo ufw allow 80/tcp
sudo ufw reload
```

---

## Security Recommendations

1. **SSL/HTTPS:** Configure SSL certificate for secure access

   ```bash
   sudo apt install certbot python3-certbot-apache
   sudo certbot --apache
   ```

2. **Strong Passwords:**
   - Use strong database passwords
   - Change default admin password immediately
   - Use secure JWT_SECRET (min 32 characters)

3. **File Permissions:**

   ```bash
   # Application files should not be writable by Apache
   sudo chown -R $USER:$USER /var/www/html/audit-monitoring
   sudo chmod -R 755 /var/www/html/audit-monitoring

   # Only uploads directory needs Apache write access
   sudo chown -R www-data:www-data /var/www/html/audit-monitoring/public/uploads
   ```

4. **MySQL Security:**

   ```bash
   sudo mysql_secure_installation
   ```

5. **Firewall:** Only open necessary ports (80, 443, 22)

6. **Regular Backups:**
   - Setup automated database backups
   - Backup application files and uploads

7. **Keep Updated:**
   ```bash
   npm audit
   npm audit fix
   ```

---

## Quick Reference

| Task              | Command                                                    |
| ----------------- | ---------------------------------------------------------- |
| View logs         | `pm2 logs audit-monitoring`                                |
| Restart app       | `pm2 restart audit-monitoring`                             |
| Stop app          | `pm2 stop audit-monitoring`                                |
| Check status      | `pm2 status`                                               |
| Reload Apache     | `sudo systemctl reload apache2`                            |
| Check Apache logs | `sudo tail -f /var/apache2/logs/error.log`                 |
| Database backup   | `mysqldump -u audit_user -p audit_monitoring > backup.sql` |

---

## Application Access

- **URL:** `http://[server-ip]/audit-monitoring/`
- **Default Port:** 3000 (internal, proxied by Apache)
- **Database:** audit_monitoring
- **Logs Directory:** `~/.pm2/logs/`

---

## Support

For issues or questions:

1. Check application logs: `pm2 logs audit-monitoring`
2. Check Apache logs: `sudo tail -f /var/apache2/logs/error.log`
3. Verify configuration: Review .env file and Apache config
4. Test database connection
5. Ensure all services are running (MySQL, Apache, PM2)
