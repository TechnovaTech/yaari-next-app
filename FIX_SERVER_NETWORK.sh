#!/bin/bash
# Fix server network connectivity to Truecaller OAuth

echo "=== Truecaller Server Network Fix ==="

# Test current connectivity
echo "1. Testing connectivity to Truecaller..."
curl -I https://oauth.truecaller.com/v1/token --connect-timeout 5 2>&1

# Check DNS resolution
echo -e "\n2. Testing DNS resolution..."
nslookup oauth.truecaller.com 2>&1

# Add Google DNS if needed
echo -e "\n3. Checking DNS configuration..."
cat /etc/resolv.conf

echo -e "\n=== Fix Commands (run on server) ==="
echo "sudo bash -c 'echo \"nameserver 8.8.8.8\" >> /etc/resolv.conf'"
echo "sudo bash -c 'echo \"nameserver 8.8.4.4\" >> /etc/resolv.conf'"
echo "sudo systemctl restart systemd-resolved"
echo "curl -I https://oauth.truecaller.com/v1/token"
