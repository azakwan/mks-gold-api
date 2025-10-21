//get data from mks website and export to json file with date

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const webScraper = async () => {
    try {
        const html = await axios.get('https://mkspamp.com.my/m/prices.xhtml');
        const $ = cheerio.load(html.data);
        let data = [];
        const currentdate = new Date().toISOString(); 
        
        // Purity mapping (anda boleh semak label ini di laman MKS jika susunan berubah)
        const purityLabels = ['9999', '999', '916', '835', '750', '375'];

        // Ambil 6 baris teratas yang mengandungi harga (indeks 0 hingga 5)
        $('table.table-full tbody tr').slice(0, 6).each((i, elem) => { 
            const beli = $(elem).find('td.royalblue label').text(); 
            const jual = $(elem).find('td.darkteal label').text(); 

            // Bersihkan teks dan tukar MYR/KG kepada MYR/Gram
            const rawBuyPrice = parseFloat(beli.replace(/\s/g, '')) / 1000;
            const rawSellPrice = parseFloat(jual.replace(/\s/g, '')) / 1000;
            
            const purity = purityLabels[i];

            if (!isNaN(rawBuyPrice) && rawBuyPrice > 100 && purity) {
                 data.push({
                    date: currentdate,
                    buy: rawBuyPrice.toFixed(2), 
                    sell: rawSellPrice.toFixed(2),
                    purity: purity
                });
            }
        });

        const outputFilePath = path.join(__dirname, 'mks.json');

        fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`mks.json berjaya dikemaskini. Jumlah rekod: ${data.length}`);
        
    } catch (error) {
        console.error('Ralat ketika web scraping:', error.message);
    }
}
webScraper();