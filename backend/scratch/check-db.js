const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL || 'postgresql://postgres:MyDB@as3@localhost:5432/jam_digital_masjid');
client.connect().then(() => {
  return client.query('SELECT * FROM devices ORDER BY created_at DESC LIMIT 1');
}).then(res => {
  console.log('Latest device:', res.rows[0]);
  client.end();
}).catch(console.error);
