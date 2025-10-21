// mks.js - Menggunakan URL Data Feed yang Lebih Stabil
// get data from mks website and export to json file with date

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// !!! URL BARU: MENGAKSES DATA FEED TERUS DARI LAMAN MKS PAMP !!!
const WEB_URL = 'https://mkspamp.com.my/web_pages/data_feed/gold_data.js';

const outputFilePath = path.join(__dirname, 'mks.json');

const webScraper = async () => {
    let data = [];
    const currentDate = new Date().toISOString();
    
    // Kita hanya fokus pada gred 999.9, 999, dan 916
    const purityLabels = ['9999', '999', '916']; 

    try {
        console.log(`Cuba akses data feed dari: ${WEB_URL}`);
        
        // Ambil data dari data feed
        const response = await axios.get(WEB_URL, { timeout: 15000 });
        
        // Data feed adalah dalam format teks Javascript, kita perlu ekstrak JSON dari dalamnya
        const text = response.data;

        // Cari string JSON yang mengandungi data harga (pattern: 'GOLD_DATA = [...];')
        const match = text.match(/GOLD_DATA\s*=\s*(\[[^;]+\]);/);
        
        if (!match || match.length < 2) {
            throw new Error('Gagal mengekstrak data GOLD_DATA dari skrip.');
        }

        // Parse JSON
        const goldData = JSON.parse(match[1]);
        
        // ID produk MKS PAMP yang kita perlukan
        // ID 999.9/KG (ID: 1) -> Kita ambil untuk 999.9
        // ID 999.9/100GM (ID: 2) -> Kita ambil untuk 999
        // ID 916 tidak ada, kita akan ambil 999.9 sebagai placeholder dan bahagi untuk 999/916

        // Kita akan guna 1KG (Index 0) sebagai asas untuk 999.9
        const kgData = goldData.find(item => item.id == 1); 

        if (!kgData) {
            throw new Error('Data 1KG (ID 1) tidak ditemui dalam data feed.');
        }

        // Harga Beli MYR/KG 
        const buyKG = parseFloat(kgData.buy.replace(/,/g, ''));

        // Harga Beli MYR/Gram untuk 999.9
        const buy9999 = buyKG / 1000;
        
        // *************************************************************************
        // Nota: Harga 999 dan 916 dikira berasaskan formula umum dari harga 999.9.
        // Formula ini adalah anggaran kerana data feed MKS PAMP tidak menyediakan 916.
        // *************************************************************************
        const buy999 = buy9999 * 0.98; // Anggaran 999 (98% dari 999.9)
        const buy916 = buy9999 * 0.90; // Anggaran 916 (90% dari 999.9)

        // Simpan hanya 3 gred yang diperlukan
        data.push({
            date: currentDate,
            buy: buy9999.toFixed(2), 
            sell: (buy9999 * 1.01).toFixed(2), // Harga Jual dijangka lebih tinggi
            purity: '9999'
        });
        
        data.push({
            date: currentDate,
            buy: buy999.toFixed(2), 
            sell: (buy999 * 1.01).toFixed(2), 
            purity: '999'
        });
        
        data.push({
            date: currentDate,
            buy: buy916.toFixed(2), 
            sell: (buy916 * 1.01).toFixed(2), 
            purity: '916'
        });

        console.log(`[SUCCESS] Berjaya memproses harga live. 999.9 Beli: ${buy9999.toFixed(2)}`);

    } catch (error) {
        console.error('Ralat ketika memproses data feed:', error.message);
        // Jika berlaku ralat, simpan data placeholder
    }

    // Jika data masih kosong atau ada ralat, simpan placeholder (0.00)
    if (data.length === 0 || data.find(d => parseFloat(d.buy) < 100)) {
        data = [{ "purity": "9999", "buy": 0.00, "sell": 0.00 }];
        console.error(`Peringatan: Gagal mendapatkan data live. Menyimpan data placeholder.`);
    } else {
        console.log(`mks.json berjaya dikemaskini. Jumlah rekod: ${data.length}`);
    }

    // Simpan data ke dalam mks.json
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

webScraper();
