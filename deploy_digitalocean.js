const { Client } = require('ssh2');

const conn = new Client();

const serverConfig = {
  host: '161.35.12.161',
  port: 22,
  username: 'root',
  password: 'NWcu!3p4zndfYwk',
};

function runRemoteCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ Executing: ${command}`);
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream
        .on('close', (code, signal) => {
          console.log(`✔ Finished with exit code: ${code}`);
          if (code === 0) resolve(stdout);
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

async function deploy() {
  console.log('🔌 Connecting to DigitalOcean Droplet (161.35.12.161)...');

  conn.on('ready', async () => {
    console.log('🟢 SSH Connection Successful!');

    try {
      // 1. Install Node.js 20, Git, Nginx, PM2
      console.log('\n--- 1. Installing Node.js & Dependencies ---');
      await runRemoteCommand('apt-get update -y');
      await runRemoteCommand('apt-get install -y curl git nginx build-essential ufw');
      await runRemoteCommand('curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
      await runRemoteCommand('apt-get install -y nodejs');
      await runRemoteCommand('npm install -g pm2');

      // 2. Clone or Update Application Code
      console.log('\n--- 2. Setting up Application Repository ---');
      await runRemoteCommand('mkdir -p /var/www');
      await runRemoteCommand(
        'if [ -d "/var/www/hosseiny-attendance" ]; then cd /var/www/hosseiny-attendance && git reset --hard && git pull origin master; else git clone https://github.com/yossefflix/hosseiny-attendance.git /var/www/hosseiny-attendance; fi'
      );

      // 3. Install & Build Production Next.js Bundle
      console.log('\n--- 3. Installing Node Modules & Building Project ---');
      await runRemoteCommand('cd /var/www/hosseiny-attendance && npm install');
      await runRemoteCommand('cd /var/www/hosseiny-attendance && npm run build');

      // 4. Configure PM2 Process Manager
      console.log('\n--- 4. Starting Server via PM2 ---');
      await runRemoteCommand(
        'cd /var/www/hosseiny-attendance && NODE_ENV=production pm2 restart hosseiny || NODE_ENV=production pm2 start server.js --name hosseiny'
      );
      await runRemoteCommand('pm2 save');
      await runRemoteCommand('pm2 startup || true');

      // 5. Configure Nginx Reverse Proxy with WebSockets Support
      console.log('\n--- 5. Configuring Nginx Reverse Proxy ---');
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

      // 6. Firewall Configuration
      console.log('\n--- 6. Setting Up Firewall Rules ---');
      await runRemoteCommand('ufw allow 80/tcp');
      await runRemoteCommand('ufw allow 22/tcp');
      await runRemoteCommand('ufw allow 443/tcp');
      await runRemoteCommand('ufw --force enable || true');

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

deploy();
