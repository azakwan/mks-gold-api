// mks.js - Versi Pembetulan dan Peningkatan Log
// get data from mks website and export to json file with date

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const WEB_URL = 'https://mkspamp.com.my/m/prices.xhtml';
const outputFilePath = path.join(__dirname, 'mks.json');

const webScraper = async () => {
    let data = [];
    const currentDate = new Date().toISOString();
    const purityLabels = ['9999', '999', '916', '835', '750', '375'];

    try {
        console.log(`Cuba scrap data dari: ${WEB_URL}`);
        
        // Ambil data dari laman MKS PAMP dengan timeout
        const html = await axios.get(WEB_URL, { timeout: 10000 });
        const $ = cheerio.load(html.data);

        // Ambil 6 baris teratas dari jadual harga (indeks 0 hingga 5)
        const rows = $('table.table.full tbody tr').slice(0, 6);

        if (rows.length === 0) {
            console.warn('Amaran: Tiada baris jadual harga yang ditemui. Kemungkinan struktur HTML telah berubah.');
        }

        rows.each((i, elem) => {
            // Ambil harga 'WE BUY' (td.royalblue.label) dan harga 'WE SELL' (td.darkred.label)
            const beli = $(elem).find('td.royalblue.label').text().trim();
            const jual = $(elem).find('td.darkred.label').text().trim();

            const rawBuyPrice = parseFloat(beli.replace(/,/g, '')) / 1000;
            const rawSellPrice = parseFloat(jual.replace(/,/g, '')) / 1000;

            const purity = purityLabels[i];

            if (!isNaN(rawBuyPrice) && rawBuyPrice > 100 && purity) {
                data.push({
                    date: currentDate,
                    buy: rawBuyPrice.toFixed(2), 
                    sell: rawSellPrice.toFixed(2),
                    purity: purity
                });
                console.log(`[SUCCESS] Data Purity ${purity} ditemui: Beli ${rawBuyPrice.toFixed(2)}`);
            } else {
                console.warn(`[SKIP] Data Purity ${purity} tidak sah atau di bawah ambang (100). Harga Beli Dikesan: ${beli}`);
            }
        });

    } catch (error) {
        console.error('Ralat ketika web scraping:', error.message);
        // Jika berlaku ralat, biarkan data kosong atau gunakan data lama
        // Dalam kes ini, kita akan teruskan dengan data kosong (agar tidak crash)
    }

    // Jika fetching gagal, data akan menjadi kosong (0 rekod).
    if (data.length === 0) {
        // Guna data placeholder asal anda untuk mengelak fail JSON yang rosak
        data = [{ "purity": "9999", "buy": 0.00, "sell": 0.00 }];
        console.error(`Peringatan: Gagal mendapatkan data live. Menyimpan data placeholder (${data.length} rekod).`);
    } else {
        console.log(`mks.json berjaya dikemaskini. Jumlah rekod: ${data.length}`);
    }

    // Simpan data ke dalam mks.json
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

webScraper();
