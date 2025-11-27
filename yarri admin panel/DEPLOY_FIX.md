# Deploy DNS Fix to Production Server

## Problem
Server cannot resolve `oauth.truecaller.com` (DNS failure)

## Quick Fix - Run on Production Server

### Option 1: Automated Script
```bash
# SSH to server
ssh user@admin.yaari.me

# Upload and run fix script
scp fix-dns.sh user@admin.yaari.me:~/
ssh user@admin.yaari.me 'bash ~/fix-dns.sh'
```

### Option 2: Manual Commands
```bash
# SSH to server
ssh user@admin.yaari.me

# Add Google DNS
sudo bash -c 'echo "nameserver 8.8.8.8" >> /etc/resolv.conf'
sudo bash -c 'echo "nameserver 8.8.4.4" >> /etc/resolv.conf'
sudo bash -c 'echo "nameserver 1.1.1.1" >> /etc/resolv.conf'

# Test DNS
nslookup oauth.truecaller.com

# Test connectivity
curl -I https://oauth.truecaller.com/v1/token

# Restart admin panel
pm2 restart yaari-admin-panel

# Check logs
pm2 logs yaari-admin-panel --lines 50
```

## Verify Fix

After running commands, test Truecaller login:
1. Open Flutter app
2. Click "Continue with Truecaller"
3. Check server logs - should NOT see "fetch failed"

## Status
- ✅ Client-side exchange working (app bypasses server)
- ⏳ Server-side needs DNS fix (optional)

## Files Updated
- `app/api/auth/truecaller-oauth/login/route.ts` - Better error handling
- `fix-dns.sh` - Automated DNS fix script
