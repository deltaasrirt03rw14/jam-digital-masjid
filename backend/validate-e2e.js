const { Client } = require('pg');
const http = require('http');
const crypto = require('crypto');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:MyDB@as3@localhost:5432/jam_digital_masjid';
const API_BASE = 'http://localhost:3000';

async function fetchApi(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(API_BASE + path, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING VALIDATION ---');
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Create Mosque directly in DB
  const mRes = await client.query(`INSERT INTO mosques (name, config_version) VALUES ('Test Mosque', 1) RETURNING id`);
  const mosqueId = mRes.rows[0].id;
  console.log('Created Mosque ID:', mosqueId);

  // A. Pairing Token Generation (Admin Endpoint)
  const failRes = await fetchApi(`/admin/mosques/${mosqueId}/pairing-tokens`, {
    method: 'POST',
    headers: { 'x-admin-mock': 'true', 'Content-Type': 'application/json' },
    body: {}
  });
  console.log('Generate Token via API (Expected 401 Fail Closed):', failRes.status);
  
  if (failRes.status !== 401) {
    console.error('FAIL: Admin endpoint did not fail closed!');
  }

  // To test the rest of the device pairing flow, we must inject a token directly into the DB.
  // Generate a mock PIN and insert the hash directly
  const bcrypt = require('bcrypt');
  const pin = '123456';
  const tokenHash = await bcrypt.hash(pin, 10);
  const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();
  await client.query(`INSERT INTO device_pairing_tokens (mosque_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [mosqueId, tokenHash, expiresAt]);
  console.log('Generated Token manually via DB:', pin);

  // B. Invalid PIN
  const invalidRes = await fetchApi(`/devices/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { deviceIdentifier: crypto.randomUUID(), token: '000000', deviceName: 'TV1' }
  });
  console.log('Invalid PIN:', invalidRes.status, invalidRes.data);

  // B. Transaction Rollback (Check if device created)
  const dCheck1 = await client.query(`SELECT count(*) FROM devices WHERE device_identifier = '00000000-0000-0000-0000-000000000001'`);
  console.log('Device count after fail (should be 0):', dCheck1.rows[0].count);

  // C. Concurrency - Attempt concurrent requests with same PIN
  console.log('Attempting Concurrent Pairing...');
  const devId1 = crypto.randomUUID();
  const devId2 = crypto.randomUUID();
  const r1 = fetchApi(`/devices/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { deviceIdentifier: devId1, token: pin, deviceName: 'Concur 1' }
  });
  const r2 = fetchApi(`/devices/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { deviceIdentifier: devId2, token: pin, deviceName: 'Concur 2' }
  });

  const [res1, res2] = await Promise.all([r1, r2]);
  console.log('Concurrent Res 1:', res1.status, res1.data.message || 'SUCCESS');
  console.log('Concurrent Res 2:', res2.status, res2.data.message || 'SUCCESS');

  // Verify only one succeeded and one failed
  const successRes = res1.status === 200 ? res1 : (res2.status === 200 ? res2 : null);
  const concurFailRes = res1.status !== 200 ? res1 : (res2.status !== 200 ? res2 : null);
  if (!successRes || !concurFailRes) {
    console.error('CONCURRENCY FAIL: Expected 1 success and 1 fail');
  }

  const apiKey = successRes.data.apiKey;
  const createdDevId = successRes === res1 ? devId1 : devId2;

  // A. Used PIN
  const usedRes = await fetchApi(`/devices/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { deviceIdentifier: crypto.randomUUID(), token: pin, deviceName: 'TV4' }
  });
  console.log('Used PIN Check:', usedRes.status, usedRes.data);

  // A. Duplicate device_identifier
  // generate another pin manually
  const pin2 = '654321';
  const tokenHash2 = await bcrypt.hash(pin2, 10);
  await client.query(`INSERT INTO device_pairing_tokens (mosque_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [mosqueId, tokenHash2, expiresAt]);
  const dupRes = await fetchApi(`/devices/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { deviceIdentifier: createdDevId, token: pin2, deviceName: 'Dup' }
  });
  console.log('Duplicate Device Check:', dupRes.status, dupRes.data);

  // E. Heartbeat (ACTIVE)
  const hbRes = await fetchApi(`/devices/${createdDevId}/heartbeat`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
  console.log('Heartbeat ACTIVE:', hbRes.status, hbRes.data);

  // Verify last_heartbeat_at in DB
  const hbCheck = await client.query(`SELECT last_heartbeat_at FROM devices WHERE device_identifier=$1`, [createdDevId]);
  console.log('DB last_heartbeat_at:', hbCheck.rows[0].last_heartbeat_at);

  // D. Device States - DISABLED
  await client.query(`UPDATE devices SET status='DISABLED' WHERE device_identifier=$1`, [createdDevId]);
  const hbDis = await fetchApi(`/devices/${createdDevId}/heartbeat`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
  console.log('Heartbeat DISABLED:', hbDis.status, hbDis.data);

  // D. Device States - REVOKED
  await client.query(`UPDATE devices SET status='REVOKED' WHERE device_identifier=$1`, [createdDevId]);
  const hbRev = await fetchApi(`/devices/${createdDevId}/heartbeat`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
  console.log('Heartbeat REVOKED:', hbRev.status, hbRev.data);

  // F. Rate Limit
  console.log('Testing Rate Limits...');
  let rlStatus = 0;
  for (let i = 0; i < 6; i++) {
    const r = await fetchApi(`/devices/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { deviceIdentifier: crypto.randomUUID(), token: '111111' }
    });
    console.log(`RL Attempt ${i+1}: ${r.status}`);
    rlStatus = r.status;
  }
  
  // Heartbeat after rate limit should still work for a valid device
  // Create another valid device directly to test
  await client.query(`UPDATE devices SET status='ACTIVE' WHERE device_identifier=$1`, [createdDevId]);
  const hbRl = await fetchApi(`/devices/${createdDevId}/heartbeat`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
  console.log('Heartbeat after Pairing Rate Limit:', hbRl.status);


  await client.end();
  console.log('--- VALIDATION END ---');
}

runTests().catch(console.error);
