async function run() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    const urls = [
        `https://api.myquran.com/v3/sholat/jadwal/1301/${year}/${month}/${day}`,
        `https://api.myquran.com/v3/sholat/jadwal/1301/${year}/${month}`,
        `https://api.myquran.com/v3/sholat/jadwal/58a2fc6ed39fd083f55d4182bf88826d/${year}/${month}/${day}`,
        `https://api.myquran.com/v3/sholat/jadwal/58a2fc6ed39fd083f55d4182bf88826d/${year}-${month}-${day}`
    ];
    
    for (const url of urls) {
        console.log("Testing:", url);
        try {
            const res = await fetch(url);
            const text = await res.text();
            console.log("Status:", res.status, "Body:", text.slice(0, 300));
        } catch (e) {
            console.log("Error:", e.message);
        }
    }
}
run();
