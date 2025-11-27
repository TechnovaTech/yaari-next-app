# Quick Fix - Run on Server NOW

## SSH to Server and Run:

```bash
# Connect to server
ssh ubuntu@admin.yaari.me

# Fix DNS (copy-paste all lines)
sudo tee /etc/resolv.conf > /dev/null <<EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF

# Make permanent
sudo chattr +i /etc/resolv.conf

# Test
curl -I https://oauth.truecaller.com/v1/token

# Restart
pm2 restart yaari-admin-panel

# Verify
pm2 logs yaari-admin-panel --lines 20
```

## Expected Result:
- ✅ curl should return `HTTP/2 400` (not "Could not resolve")
- ✅ No more "ENOTFOUND" errors in logs
- ✅ Truecaller login works

## If Still Fails:
App already uses client-side exchange - users can still login!
