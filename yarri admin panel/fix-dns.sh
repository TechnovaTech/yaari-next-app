#!/bin/bash
# Fix DNS resolution for Truecaller OAuth on production server

echo "=== Fixing DNS Resolution for Truecaller ==="

# Backup current resolv.conf
sudo cp /etc/resolv.conf /etc/resolv.conf.backup

# Add Google DNS
echo "Adding Google DNS servers..."
sudo bash -c 'cat >> /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF'

# Test DNS resolution
echo -e "\nTesting DNS resolution..."
nslookup oauth.truecaller.com

# Test connectivity
echo -e "\nTesting HTTPS connectivity..."
curl -I https://oauth.truecaller.com/v1/token --connect-timeout 5

# Restart admin panel
echo -e "\nRestarting admin panel..."
pm2 restart yaari-admin-panel

echo -e "\n✅ Done! Test Truecaller login now."
