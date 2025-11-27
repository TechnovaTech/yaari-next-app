module.exports = {
  apps: [{
    name: 'yaari-admin',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      TRUECALLER_CLIENT_ID: 'fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs'
    }
  }]
}
