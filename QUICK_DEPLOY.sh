#!/bin/bash

# Yaari Admin Panel - Quick Deploy Script
# Run this on your Ubuntu VPS

echo "=========================================="
echo "Yaari Admin Panel - Deployment Script"
echo "=========================================="

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install MongoDB
echo "Installing MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
echo "Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Git
echo "Installing Git..."
sudo apt install -y git

# Clone repository
echo "Cloning repository..."
cd /var/www
sudo git clone https://github.com/TechnovaTech/Yarri-Dat-App.git yaari
sudo chown -R $USER:$USER /var/www/yaari

# Install dependencies
echo "Installing dependencies..."
cd /var/www/yaari/yarri\ admin\ panel
npm install

# Build application
echo "Building application..."
npm run build

# Start with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "=========================================="
echo "Deployment Complete!"
echo "Next steps:"
echo "1. Configure Nginx (see DEPLOYMENT_GUIDE.md)"
echo "2. Setup SSL with Certbot"
echo "3. Update .env.production with your settings"
echo "=========================================="
