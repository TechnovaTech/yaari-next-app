#!/bin/bash
# Restart admin panel on server

ssh ubuntu@admin.yaari.me << 'EOF'
cd ~/yarri-admin-panel
pm2 restart yaari-admin-panel
pm2 logs yaari-admin-panel --lines 10
EOF
