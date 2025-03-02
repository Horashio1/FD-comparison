const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeCategory(category, url, categoryId) {
    console.log(`Scraping category: ${category} from URL: ${url}`);
    const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    const page = await browser.newPage();

    // Set viewport and user-agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log(`Page loaded successfully for category: ${category} from URL: ${url}`);

        const promotions = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.col-md-4'));
            return cards.map(card => {
                const imageUrl = card.querySelector('.front')?.style?.backgroundImage?.match(/url\((['"]?)(.*?)\1\)/)?.[2] || '';
                const merchantDetails = card.querySelector('h6.flip-back-header2')?.innerText || '';
                if (merchantDetails === 'Terms & Conditions') return null;
                const discount = card.querySelector('h6[style*="sansation-bold"]')?.innerText || '';
                const validity = card.querySelector('h2.flip-back-header3')?.innerText || '';

                // Collect all lines of offer details
                const offerDetailsElements = card.querySelectorAll('h6.text-type1.mt2');
                const offerDetails = Array.from(offerDetailsElements)
                    .map(el => el.innerText.trim().replace(/\n/g, ' '))
                    .filter(text => text !== '');

                // Extract the first offer detail
                const offerDetails1 = offerDetails.length > 0 ? offerDetails[0] : '';

                return {
                    imageUrl,
                    merchantDetails,
                    discount,
                    validity,
                    offerDetails1,
                };
            }).filter(promo => promo !== null);
        });

        console.log(`Scraped ${promotions.length} promotions for category: ${category} from URL: ${url}`);
        return { categoryId, promotions, categoryUrl: url };

    } catch (error) {
        console.error(`Error scraping category: ${category} from URL: ${url} - ${error.message}`);
        return { categoryId, promotions: [], categoryUrl: url };
    } finally {
        await browser.close();
    }
}

async function scrapePeoplesBankPromos() {
    const categories = [
        { name: 'Dining', url: 'https://www.peoplesbank.lk/restaurants-credit-card/', id: 1 },
        { name: 'Hotel', url: 'https://www.peoplesbank.lk/leisure-credit-card/', id: 2 },
        { name: 'Groceries', url: 'https://www.peoplesbank.lk/super-markets-credit-card/', id: 3 },
        { name: 'Shopping', url: 'https://www.peoplesbank.lk/clothing-credit-card/', id: 4 },
        { name: 'Shopping', url: 'https://www.peoplesbank.lk/electronics-credit-card/', id: 4 },
        { name: 'Shopping', url: 'https://www.peoplesbank.lk/shoes-leather-credit-card/', id: 4 },
        { name: 'Shopping', url: 'https://www.peoplesbank.lk/credit-card-others/', id: 4 },
    ];

    const csvFilePath = path.join(__dirname, 'scraped_results', 'PeoplesBank_data.csv');
    const csvDir = path.dirname(csvFilePath);

    if (!fs.existsSync(csvDir)) {
        fs.mkdirSync(csvDir, { recursive: true });
    }

    const csvWriterInstance = csvWriter({
        path: csvFilePath,
        header: [
            { id: 'bank_id', title: 'bank_id' },
            { id: 'category_id', title: 'category_id' },
            { id: 'merchant_details', title: 'merchant_details' },
            { id: 'discount', title: 'discount' },
            { id: 'offer_validity', title: 'offer_validity' },
            { id: 'offer_details_1', title: 'offer_details_1' }, 
            { id: 'image_url', title: 'image_url' },
            { id: 'more_details_url', title: 'more_details_url' },
        ]
    });

    const allData = [];
    const BANK_ID = 11;

    for (const category of categories) {
        const result = await scrapeCategory(category.name, category.url, category.id);

        for (const promo of result.promotions) {
            allData.push({
                bank_id: BANK_ID,
                category_id: result.categoryId,
                merchant_details: promo.merchantDetails,
                discount: promo.discount,
                offer_validity: promo.validity,
                offer_details_1: promo.offerDetails1,
                image_url: promo.imageUrl,
                more_details_url: result.categoryUrl,
            });
        }
    }

    await csvWriterInstance.writeRecords(allData);
    console.log('CSV file has been written successfully.');
}

scrapePeoplesBankPromos();
