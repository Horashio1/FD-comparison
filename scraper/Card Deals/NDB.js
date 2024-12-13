const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeCategory(category, url) {
    console.log(`Scraping category: ${category}`);
    const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    const page = await browser.newPage();

    // Set viewport and user-agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('.ant-row.desktop-block', { timeout: 60000 });

        console.log(`Page loaded successfully for category: ${category}`);

        const promotions = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.ant-card'));
            return cards.map(card => {
                const coverImage = card.querySelector('.ant-image img')?.src || '';
                const merchantImage = card.querySelector('.ant-card-meta-avatar img')?.src || '';
                const merchantName = card.querySelector('.ant-card-meta-title')?.innerText || '';
                const promoDetails = card.querySelector('.PromotionMobile_details__z7myj h5')?.innerText || '';
                const validity = card.querySelector('.PromotionMobile_validity__39zdc span')?.innerText || '';
                const merchantDetails = card.querySelector('.PromotionMobile_merchantDescription__1BkVS span')?.innerText || '';
                const merchantPhone = Array.from(card.querySelectorAll('.PromotionMobile_merchantDescription__1BkVS li')).map(li => li.innerText).join(', ') || '';

                return {
                    coverImage,
                    merchantImage,
                    merchantName,
                    promoDetails,
                    validity,
                    merchantDetails,
                    merchantPhone
                };
            });
        });

        console.log(`Scraped ${promotions.length} promotions for category: ${category}`);
        return { category, promotions };

    } catch (error) {
        console.error(`Error scraping category: ${category} - ${error.message}`);
        return { category, promotions: [] };
    } finally {
        await browser.close();
    }
}

async function scrapeNDBPromotions() {
    const categories = [
        { name: 'Shopping', url: 'https://www.ndbbank.com/cards/card-offers/supermarkets', id: 3 },
        { name: 'Dining', url: 'https://www.ndbbank.com/cards/card-offers/restaurants-pubs', id: 1 },
        { name: 'Hotels', url: 'https://www.ndbbank.com/cards/card-offers/hotels-villas', id: 2 }
    ];

    const csvFilePath = path.join(__dirname, 'scraped_results', 'NDB_data.csv');
    const csvDir = path.dirname(csvFilePath);

    if (!fs.existsSync(csvDir)) {
        fs.mkdirSync(csvDir, { recursive: true });
    }

    const csvWriterInstance = csvWriter({
        path: csvFilePath,
        header: [
            { id: 'bank_id', title: 'bank_id' },
            { id: 'category_id', title: 'category_id' },
            { id: 'offer_title', title: 'offer_title' },
            { id: 'merchant_details', title: 'merchant_details' },
            { id: 'merchant_contact', title: 'merchant_contact' },
            { id: 'offer_details_1', title: 'offer_details_1' },
            { id: 'offer_details_2', title: 'offer_details_2' },
            { id: 'offer_validity', title: 'offer_validity' },
            { id: 'discount', title: 'discount' },
            { id: 'image_url', title: 'image_url' },
            { id: 'more_details_url', title: 'more_details_url' }
        ]
    });

    const allData = [];

    for (const category of categories) {
        const result = await scrapeCategory(category.name, category.url);
        const categoryId = category.id;

        for (const promo of result.promotions) {
            allData.push({
                bank_id: 4,
                category_id: categoryId,
                offer_title: `${promo.promoDetails.split(' ').slice(0, 2).join(' ')} at ${promo.merchantName}`,
                merchant_details: promo.merchantName,
                merchant_contact: promo.merchantPhone, // Corrected reference to promo.merchantPhone
                offer_details_1: promo.promoDetails, // Include both promoDetails and merchantDetails
                offer_details_2: promo.merchantDetails,
                offer_validity: promo.validity,
                discount: '',
                image_url: promo.merchantImage,
                more_details_url: category.url
            });
        }
    }

    await csvWriterInstance.writeRecords(allData);
    console.log('CSV file has been written successfully.');
}

scrapeNDBPromotions();
