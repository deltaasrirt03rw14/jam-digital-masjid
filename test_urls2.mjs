async function run() {
    const urls = [
        `https://api.myquran.com/v3/sholat/jadwal/58a2fc6ed39fd083f55d4182bf88826d/2026-08`,
        `https://api.myquran.com/v3/sholat/jadwal/58a2fc6ed39fd083f55d4182bf88826d/2026/08`,
        `https://api.myquran.com/v3/sholat/jadwal/58a2fc6ed39fd083f55d4182bf88826d/2026-08-01`
    ];
    
    for (const url of urls) {
        console.log("Testing:", url);
        try {
            const res = await fetch(url);
            const text = await res.text();
            console.log("Status:", res.status, "Body size:", text.length, "Preview:", text.slice(0, 200));
        } catch (e) {
            console.log("Error:", e.message);
        }
    }
}
run();
