// mks.js - Menggunakan GoldAPI.io dengan Kalkulasi Penuh MYR/Gram

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// =========================================================================
// !!! PARAMETER WAJIB KEMAS KINI !!!
// =========================================================================
// 1. KUNCI API ANDA (Telah dimasukkan)
const API_KEY = 'goldapi-58n6619mh0xp56k-io'; 

// 2. Kadar Pertukaran USD ke MYR (Sila kemas kini nilai ini)
const USD_TO_MYR_RATE = 4.70; // Contoh: 1 USD = 4.70 MYR

// 3. Faktor Spread Beli Balik Anda (Anggapan: Anda beli balik pada 98.5% dari harga pasaran)
const YOUR_BUY_SPREAD_FACTOR = 0.985; 
// =========================================================================

const outputFilePath = path.join(__dirname, 'mks.json');
const OUNCE_TO_GRAM_FACTOR = 31.1035; // 1 troy ounce = 31.1035 gram

const webScraper = async () => {
    let data = [];
    const currentDate = new Date().toISOString();

    try {
        console.log(`Cuba akses GoldAPI.io (Menggunakan spread: ${YOUR_BUY_SPREAD_FACTOR * 100}%)`);
        
        // Panggil API untuk harga emas Spot (999.9) dalam USD/Ounce
        const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
            headers: {
                'x-access-token': API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 15000 
        });
        
        const spotData = response.data;
        
        // Harga Spot Emas 999.9/Ounce (USD)
        const usdPerOunce = spotData.price; 
        
        // ***************************************************************
        // LAKUKAN PENUKARAN: USD/Ounce -> MYR/Gram (Harga Pasaran 999.9)
        // ***************************************************************
        const myrPerGram9999_Market = (usdPerOunce / OUNCE_TO_GRAM_FACTOR) * USD_TO_MYR_RATE;

        // Harga Beli Balik Anda (Buy Back)
        const buy9999 = myrPerGram9999_Market * YOUR_BUY_SPREAD_FACTOR;
        
        // Anggaran Harga Jualan (Jual kepada Anda) - Anggap 1.5% lebih tinggi dari harga pasaran
        const sell9999 = myrPerGram9999_Market * 1.015;

        // Kalkulasi Harga Beli Balik (Buy Back) untuk gred lain
        const buy999 = buy9999 * 0.98; // 99.9% dari 99.99%
        const buy916 = buy9999 * 0.90; // 91.6% dari 99.99%
        
        // Kalkulasi Harga Jualan untuk gred lain
        const sell999 = sell9999 * 0.98; 
        const sell916 = sell9999 * 0.90; 

        // Simpan 3 gred yang diperlukan (9999, 999, 916)
        data.push({ date: currentDate, buy: buy9999.toFixed(2), sell: sell9999.toFixed(2), purity: '9999' });
        data.push({ date: currentDate, buy: buy999.toFixed(2), sell: sell999.toFixed(2), purity: '999' });
        data.push({ date: currentDate, buy: buy916.toFixed(2), sell: sell916.toFixed(2), purity: '916' });

        console.log(`[SUCCESS] Data Live dari GoldAPI berjaya diproses. 999.9 Beli: ${buy9999.toFixed(2)} MYR/Gram`);

    } catch (error) {
        console.error('Ralat ketika memproses GoldAPI:', error.message);
        // Jika ralat (cth: 401 Unauthorized - API Key salah)
    }

    // Simpan placeholder jika data gagal atau kosong
    if (data.length === 0 || data.find(d => parseFloat(d.buy) < 100)) {
        data = [{ "purity": "9999", "buy": 0.00, "sell": 0.00 }];
        console.error(`Peringatan: Gagal mendapatkan data live dari GoldAPI. Menyimpan data placeholder.`);
    } else {
        console.log(`mks.json berjaya dikemaskini. Jumlah rekod: ${data.length}`);
    }

    // Simpan data ke dalam mks.json
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

webScraper();
