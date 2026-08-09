const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  conn.exec('ps aux | grep npm', (err, stream) => {
    let stdout = '';
    stream.on('data', (d) => (stdout += d.toString()));
    stream.on('close', () => {
      console.log('Running npm processes on server:\n', stdout);
      conn.end();
    });
  });
}).connect({
  host: '161.35.12.161',
  port: 22,
  username: 'root',
  password: 'NWcu!3p4zndfYwk',
});
