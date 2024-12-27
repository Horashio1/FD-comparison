const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeCategory(category, url, categoryId) {
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
        console.log(`Page loaded successfully for category: ${category}`);

        const promotions = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.col-md-4'));
            return cards.map(card => {
                const imageUrl = card.querySelector('.front')?.style?.backgroundImage?.match(/url\((['"]?)(.*?)\1\)/)?.[2] || '';
                const merchantDetails = card.querySelector('h6.flip-back-header2')?.innerText || '';
                if (merchantDetails === 'Terms & Conditions') return null;
                const merchantContact = card.querySelector('h6.flip-back-text.mt-4')?.innerText || '';
                const discount = card.querySelector('h6[style*="sansation-bold"]')?.innerText || '';
                const validity = card.querySelector('h2.flip-back-header3')?.innerText || '';

                // Collect all lines of offer details
                const offerDetailsElements = card.querySelectorAll('h6.text-type1.mt2');
                const offerDetails = Array.from(offerDetailsElements)
                    .map(el => el.innerText.trim().replace(/\n/g, ' '))
                    .filter(text => text !== '');

                return {
                    imageUrl,
                    merchantDetails,
                    merchantContact,
                    discount,
                    validity,
                    offerDetails: offerDetails.join(' \n '),
                };
            }).filter(promo => promo !== null);
        });

        console.log(`Scraped ${promotions.length} promotions for category: ${category}`);
        return { categoryId, promotions };

    } catch (error) {
        console.error(`Error scraping category: ${category} - ${error.message}`);
        return { categoryId, promotions: [] };
    } finally {
        await browser.close();
    }
}

async function scrapePeoplesBankPromos() {
    const categories = [
        { name: 'Dining', url: 'https://www.peoplesbank.lk/restaurants-credit-card/', id: 1 },
        { name: 'Hotel', url: 'https://www.peoplesbank.lk/leisure-credit-card/', id: 2 },
        { name: 'Groceries', url: 'https://www.peoplesbank.lk/super-markets-credit-card/', id: 3 },
        { name: 'Shopping', url: 'https://www.peoplesbank.lk/clothing-credit-card/', id: 4 }
    ];

    const csvFilePath = path.join(__dirname, 'scraped_results', 'PeoplesBank_data.csv');
    const jsonFilePath = path.join(__dirname, 'scraped_results', 'PeoplesBank_data.json');
    const csvDir = path.dirname(csvFilePath);

    if (!fs.existsSync(csvDir)) {
        fs.mkdirSync(csvDir, { recursive: true });
    }

    const csvWriterInstance = csvWriter({
        path: csvFilePath,
        header: [
            { id: 'categoryId', title: 'category_id' },
            { id: 'merchantDetails', title: 'Merchant_details' },
            { id: 'discount', title: 'discount' },
            { id: 'validity', title: 'Validity' },
            { id: 'offerDetails', title: 'Offer_Details' },
            { id: 'merchantContact', title: 'merchant_contact' },
            { id: 'imageUrl', title: 'image_url' },
        ]
    });

    const allData = [];

    for (const category of categories) {
        const result = await scrapeCategory(category.name, category.url, category.id);

        for (const promo of result.promotions) {
            allData.push({
                categoryId: result.categoryId,
                ...promo
            });
        }
    }

    await csvWriterInstance.writeRecords(allData);
    console.log('CSV file has been written successfully.');

    fs.writeFileSync(jsonFilePath, JSON.stringify(allData, null, 2));
    console.log('JSON file has been written successfully.');
}

scrapePeoplesBankPromos();
