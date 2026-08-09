const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  conn.exec('cd /var/www/hosseiny-attendance && NODE_ENV=production node server.js', (err, stream) => {
    let stdout = '';
    let stderr = '';
    stream.on('data', (d) => (stdout += d.toString()));
    stream.stderr.on('data', (d) => (stderr += d.toString()));
    stream.on('close', (code) => {
      console.log('--- DIRECT NODE SERVER.JS EXECUTION ---');
      console.log('Exit Code:', code);
      console.log('STDOUT:\n', stdout);
      console.log('STDERR:\n', stderr);
      conn.end();
    });
  });
}).connect({
  host: '161.35.12.161',
  port: 22,
  username: 'root',
  password: 'NWcu!3p4zndfYwk',
});
