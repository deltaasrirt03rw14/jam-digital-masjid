const CITIES = [
    "Jakarta",
    "Bandung",
    "Surabaya",
    "Semarang",
    "Yogyakarta",
    "Surakarta", 
    "Magelang",
    "Tegal",
    "Pekalongan",
    "Purwokerto",
    "Cilacap",
    "Banyumas"
];

async function measure(name, fetchPromise) {
    const start = Date.now();
    try {
        const res = await fetchPromise;
        const latency = Date.now() - start;
        const json = await res.json();
        return { name, latency, status: res.status, ok: res.ok, data: json, error: null };
    } catch (e) {
        return { name, latency: Date.now() - start, ok: false, error: e.message };
    }
}

async function run() {
    console.log("=== PRAYER PROVIDER COMPARISON TEST ===\n");
    
    const mq_v3_kota = await measure("myQuran_v3_semua_kota", fetch('https://api.myquran.com/v3/sholat/kota/semua'));
    if (!mq_v3_kota.ok) {
        console.log("myQuran v3 kota lookup failed. HTTP", mq_v3_kota.status);
    } else {
        console.log("myQuran v3 kota lookup OK");
    }

    const mq_v2_kota = await measure("myQuran_v2_semua_kota", fetch('https://api.myquran.com/v2/sholat/kota/semua'));
    
    let mqCities = mq_v3_kota.ok ? mq_v3_kota.data.data : (mq_v2_kota.ok ? (mq_v2_kota.data.data || mq_v2_kota.data) : []);
    console.log("myQuran total cities loaded:", mqCities.length);
    
    const eqProvRes = await measure("EQuran_provinsi", fetch('https://equran.id/api/v2/shalat/provinsi'));
    let eqCities = [];
    if (eqProvRes.ok && eqProvRes.data.data) {
        for (const prov of eqProvRes.data.data) {
             const kabkotaRes = await fetch('https://equran.id/api/v2/shalat/kabkota', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ provinsi: prov.provinsi || prov })
             });
             const kabkotaJson = await kabkotaRes.json();
             if (kabkotaJson.data) {
                 eqCities = eqCities.concat(kabkotaJson.data.map(k => ({ provinsi: prov.provinsi || prov, kabkota: k })));
             }
        }
        console.log("EQuran total kabkota loaded:", eqCities.length);
    } else {
        console.log("EQuran prov lookup failed", eqProvRes.status, eqProvRes.data);
    }

    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    for (const city of CITIES) {
         console.log(`\nTesting City: ${city}`);
         const mqMatch = mqCities.find(c => c.lokasi && c.lokasi.toLowerCase().includes(city.toLowerCase()));
         if (mqMatch) {
             console.log(`  myQuran: Found [${mqMatch.id}] ${mqMatch.lokasi}`);
             const mqUrl = `https://api.myquran.com/v2/sholat/jadwal/${mqMatch.id}/${year}/${month}/${day}`;
             const mqRes = await measure(`myQuran_jadwal_${city}`, fetch(mqUrl));
             if (mqRes.ok) {
                  console.log(`  myQuran Data:`, JSON.stringify(mqRes.data.data.jadwal || mqRes.data.data));
                  console.log(`  myQuran Latency: ${mqRes.latency}ms`);
             } else {
                  console.log(`  myQuran ERROR: ${mqRes.status}`);
             }
             
             // Monthly Test
             const mqMonthUrl = `https://api.myquran.com/v2/sholat/jadwal/${mqMatch.id}/${year}/${month}`;
             const mqMonthRes = await measure(`myQuran_month_${city}`, fetch(mqMonthUrl));
             console.log(`  myQuran Monthly: ${mqMonthRes.ok ? "OK" : "Failed"}`);
         } else {
             console.log(`  myQuran: NOT FOUND`);
         }
         
         const eqMatch = eqCities.find(c => c.kabkota.toLowerCase().includes(city.toLowerCase()));
         if (eqMatch) {
             console.log(`  EQuran: Found ${eqMatch.kabkota} (${eqMatch.provinsi})`);
             const eqUrl = `https://equran.id/api/v2/shalat`;
             const eqRes = await measure(`EQuran_jadwal_${city}`, fetch(eqUrl, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     provinsi: eqMatch.provinsi,
                     kabkota: eqMatch.kabkota
                 })
             }));
             if (eqRes.ok && eqRes.data.data) {
                  console.log(`  EQuran Data (Day 1):`, JSON.stringify(eqRes.data.data[0]));
                  console.log(`  EQuran Latency: ${eqRes.latency}ms`);
                  console.log(`  EQuran Monthly: OK (Returns array of ${eqRes.data.data.length} days)`);
             } else {
                  console.log(`  EQuran ERROR:`, eqRes.status, eqRes.data);
             }
         } else {
             console.log(`  EQuran: NOT FOUND`);
         }
    }
}

run();
