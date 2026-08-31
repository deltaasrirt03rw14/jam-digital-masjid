const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
  await client.connect();
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' AND table_type='BASE TABLE'
  `);
  console.log("TABLES:", tables.rows.map(r => r.table_name).join(', '));

  for (const table of ['mosques', 'devices', 'device_pairing_tokens']) {
    console.log(`\n--- ${table.toUpperCase()} COLUMNS ---`);
    const cols = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
      ORDER BY ordinal_position
    `, [table]);
    cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (null: ${c.is_nullable}, default: ${c.column_default})`));

    console.log(`--- ${table.toUpperCase()} CONSTRAINTS ---`);
    const cons = await client.query(`
      SELECT tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = $1
    `, [table]);
    cons.rows.forEach(c => {
      if (c.constraint_type === 'FOREIGN KEY') {
        console.log(`  ${c.constraint_name} (${c.constraint_type}): ${c.column_name} -> ${c.foreign_table_name}(${c.foreign_column_name})`);
      } else {
        console.log(`  ${c.constraint_name} (${c.constraint_type}): on ${c.column_name}`);
      }
    });
  }
  
  await client.end();
}

checkSchema().catch(console.error);
