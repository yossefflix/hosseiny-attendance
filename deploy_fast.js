const { Client } = require('ssh2');

const conn = new Client();

const serverConfig = {
  host: '161.35.12.161',
  port: 22,
  username: 'root',
  password: 'NWcu!3p4zndfYwk',
};

function runRemoteCommand(command, ignoreError = false) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ Executing: ${command}`);
    conn.exec(command, (err, stream) => {
      if (err) {
        if (ignoreError) return resolve('');
        return reject(err);
      }
      let stdout = '';
      let stderr = '';
      stream
        .on('close', (code, signal) => {
          console.log(`✔ Finished with exit code: ${code}`);
          if (code === 0 || ignoreError) resolve(stdout);
          else reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        })
        .on('data', (data) => {
          stdout += data.toString();
          process.stdout.write(data.toString());
        })
        .stderr.on('data', (data) => {
          stderr += data.toString();
          process.stderr.write(data.toString());
        });
    });
  });
}

async function deployFast() {
  console.log('🔌 Connecting to DigitalOcean Droplet (161.35.12.161)...');

  conn.on('ready', async () => {
    console.log('🟢 SSH Connection Successful!');

    try {
      // 1. Setup 2GB Swap Memory
      console.log('\n--- 1. Setting Up 2GB Swap Memory ---');
      await runRemoteCommand('if [ ! -f /swapfile ]; then fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile; fi', true);

      // 2. Clone/Pull Repository
      console.log('\n--- 2. Pulling Latest Repository Code ---');
      await runRemoteCommand('mkdir -p /var/www', true);
      await runRemoteCommand(
        'if [ -d "/var/www/hosseiny-attendance" ]; then cd /var/www/hosseiny-attendance && git reset --hard && git pull origin master; else git clone https://github.com/yossefflix/hosseiny-attendance.git /var/www/hosseiny-attendance; fi'
      );

      // 3. Install NPM Dependencies
      console.log('\n--- 3. Installing NPM Dependencies ---');
      await runRemoteCommand('cd /var/www/hosseiny-attendance && npm install');

      // 4. Build Next.js Production Bundle
      console.log('\n--- 4. Building Next.js Production Bundle ---');
      await runRemoteCommand('cd /var/www/hosseiny-attendance && NODE_OPTIONS="--max-old-space-size=1536" npm run build');

      // 5. Start Express & Socket.io Server with PM2
      console.log('\n--- 5. Starting Express & Socket.io Server via PM2 ---');
      await runRemoteCommand('cd /var/www/hosseiny-attendance && NODE_ENV=production pm2 restart hosseiny || NODE_ENV=production pm2 start server.js --name hosseiny');
      await runRemoteCommand('pm2 save', true);

      // 6. Configure Nginx Reverse Proxy
      console.log('\n--- 6. Configuring Nginx Reverse Proxy ---');
      const nginxConfig = `
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
      await runRemoteCommand(`cat << 'EOF' > /etc/nginx/sites-available/default
${nginxConfig}
EOF`);

      await runRemoteCommand('nginx -t');
      await runRemoteCommand('systemctl reload nginx');

      // 7. Firewall Rules
      await runRemoteCommand('ufw allow 80/tcp', true);
      await runRemoteCommand('ufw allow 22/tcp', true);
      await runRemoteCommand('ufw allow 443/tcp', true);

      console.log('\n======================================================');
      console.log('🎉 DEPLOYMENT COMPLETE! SYSTEM IS LIVE ON DIGITALOCEAN!');
      console.log('🌐 Public Web URL: http://161.35.12.161');
      console.log('======================================================\n');
    } catch (err) {
      console.error('\n❌ Deployment Error:', err.message);
    } finally {
      conn.end();
    }
  });

  conn.connect(serverConfig);
}

deployFast();
