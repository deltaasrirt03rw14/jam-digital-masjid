async function measure(name, fetchPromise) {
    const start = Date.now();
    try {
        const res = await fetchPromise;
        const latency = Date.now() - start;
        const text = await res.text();
        return { name, latency, status: res.status, text };
    } catch (e) {
        return { name, latency: Date.now() - start, text: e.message };
    }
}

async function run() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    // myQuran v2 / v3
    // Let's use id for Jakarta: 1301 (v1/v2 had different IDs, wait, the v3 lookup returned "58a2fc6ed39fd083f55d4182bf88826d")
    // Wait, let's fetch kota "Jakarta" first to see the ID shape in v3 vs v2.
    const k1 = await fetch('https://api.myquran.com/v3/sholat/kota/semua').then(r => r.json());
    const k2 = await fetch('https://api.myquran.com/v2/sholat/kota/semua').then(r => r.json());
    // find jakarta in both
    const jkt3 = k1.data ? k1.data.find(k => k.lokasi && k.lokasi.includes("JAKARTA")) : null;
    const jkt2 = (k2.data ? k2.data : k2).find(k => k.lokasi && k.lokasi.includes("JAKARTA"));
    console.log("v3 JKT:", jkt3);
    console.log("v2 JKT:", jkt2);
    
    if (jkt3) {
        const j3 = await measure("mq_v3", fetch(`https://api.myquran.com/v3/sholat/jadwal/${jkt3.id}/${year}/${month}/${day}`));
        console.log("v3 daily:", j3.status, j3.text.slice(0, 500));
        const m3 = await measure("mq_v3_month", fetch(`https://api.myquran.com/v3/sholat/jadwal/${jkt3.id}/${year}/${month}`));
        console.log("v3 month:", m3.status, m3.text.slice(0, 500));
    }
    
    if (jkt2) {
        const j2 = await measure("mq_v2", fetch(`https://api.myquran.com/v2/sholat/jadwal/${jkt2.id}/${year}/${month}/${day}`));
        console.log("v2 daily:", j2.status, j2.text.slice(0, 500));
    }
    
    // EQuran
    const eqProvRes = await fetch('https://equran.id/api/v2/shalat/provinsi').then(r => r.json());
    const eqKab = await fetch('https://equran.id/api/v2/shalat/kabkota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provinsi: "DKI Jakarta" })
    }).then(r => r.json());
    console.log("EQ JKT:", eqKab.data.find(k => k.includes("Jakarta")));
    
    const eqJadwal = await measure("eq", fetch(`https://equran.id/api/v2/shalat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provinsi: "DKI Jakarta", kabkota: "Kota Jakarta", bulan: parseInt(month), tahun: year })
    }));
    console.log("EQ daily:", eqJadwal.status, eqJadwal.text.slice(0, 500));
}

run();
