async function measure(name, fetchPromise) {
    try {
        const res = await fetchPromise;
        const text = await res.text();
        return { name, status: res.status, text };
    } catch (e) {
        return { name, status: 0, text: e.message };
    }
}

async function run() {
    console.log(await measure("mq_invalid_city", fetch(`https://api.myquran.com/v3/sholat/jadwal/INVALID/2026-08-18`)));
    console.log(await measure("mq_invalid_date", fetch(`https://api.myquran.com/v3/sholat/jadwal/58a2fc6ed39fd083f55d4182bf88826d/2026-99-99`)));

    console.log(await measure("eq_invalid_city", fetch(`https://equran.id/api/v2/shalat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provinsi: "DKI Jakarta", kabkota: "Kota Invalid", bulan: 8, tahun: 2026 })
    })));
    console.log(await measure("eq_invalid_date", fetch(`https://equran.id/api/v2/shalat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provinsi: "DKI Jakarta", kabkota: "Kota Jakarta", bulan: 99, tahun: 2026 })
    })));
}
run();
