#!/bin/bash
# Fix DNS on Ubuntu server - Run this on your production server

echo "=== Fixing DNS Resolution ==="

# Backup
sudo cp /etc/resolv.conf /etc/resolv.conf.backup.$(date +%s)

# Fix DNS
sudo tee /etc/resolv.conf > /dev/null <<EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF

# Make immutable (prevent overwrite)
sudo chattr +i /etc/resolv.conf

# Test
echo -e "\nTesting DNS..."
nslookup oauth.truecaller.com

echo -e "\nTesting connectivity..."
curl -I https://oauth.truecaller.com/v1/token --connect-timeout 5

# Restart admin panel
echo -e "\nRestarting admin panel..."
pm2 restart yaari-admin-panel

echo -e "\n✅ Done! Check logs:"
echo "pm2 logs yaari-admin-panel --lines 20"
