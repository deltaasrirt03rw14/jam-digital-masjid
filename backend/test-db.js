const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:MyDB@as3@localhost:5432/jam_digital_masjid'
});

client.connect()
  .then(() => {
    console.log(`DB CONNECTION SUCCESS: ${client.host}:${client.port} -> ${client.database}`);
    return client.query('SELECT version()');
  })
  .then(res => {
    console.log(`PostgreSQL VERSION: ${res.rows[0].version}`);
    client.end();
  })
  .catch(e => {
    console.error('DB CONNECTION FAILED: ', e.message);
    process.exit(1);
  });
