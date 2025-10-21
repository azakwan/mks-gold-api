// mks.js
// get data from mks website and export to json file with date

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const webScraper = async () => {
    try {
        // Ambil data dari laman MKS PAMP
        const html = await axios.get('https://mkspamp.com.my/m/prices.xhtml');
        const $ = cheerio.load(html.data);
        let data = [];
        const currentDate = new Date().toISOString();

        // Label ketulenan (purity) untuk 6 gred emas
        const purityLabels = ['9999', '999', '916', '835', '750', '375'];

        // Ambil 6 baris teratas dari jadual harga (indeks 0 hingga 5)
        $('table.table.full tbody tr').slice(0, 6).each((i, elem) => {
            // Ambil harga 'WE BUY' (td.royalblue.label) dan harga 'WE SELL' (td.darkred.label)
            const beli = $(elem).find('td.royalblue.label').text().trim();
            const jual = $(elem).find('td.darkred.label').text().trim();

            // Bersihkan teks (buang koma) dan TUKAR MYR/KG kepada MYR/Gram (bahagi 1000)
            const rawBuyPrice = parseFloat(beli.replace(/,/g, '')) / 1000;
            const rawSellPrice = parseFloat(jual.replace(/,/g, '')) / 1000;

            const purity = purityLabels[i];

            if (!isNaN(rawBuyPrice) && rawBuyPrice > 100 && purity) {
                data.push({
                    date: currentDate,
                    buy: rawBuyPrice.toFixed(2), // Harga MYR/Gram yang sudah betul (RM500+)
                    sell: rawSellPrice.toFixed(2),
                    purity: purity
                });
            }
        });

        // Simpan data ke dalam mks.json
        const outputFilePath = path.join(__dirname, 'mks.json');
        fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`mks.json berjaya dikemaskini. Jumlah rekod: ${data.length}`);

    } catch (error) {
        console.error('Ralat ketika web scraping:', error.message);
    }
}

webScraper();
