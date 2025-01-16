const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeDFCCPromotions() {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 50,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set desktop viewport dimensions and user-agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    const baseURL = 'https://www.dfcc.lk';
    const categories = [
        // { name: 'dining', url: `${baseURL}/promotions-categories/dining` },
        // { name: 'hotels', url: `${baseURL}/promotions-categories//hotels` },
        // { name: 'groceries', url: `${baseURL}/promotions-categories/supermarket` },
        { name: 'shopping', url: `${baseURL}/promotions-categories/clothing__retail` },
        { name: 'shopping', url: `${baseURL}/promotions-categories/home-appliances` }
    ];

    const results = [];

    for (const category of categories) {
        console.log(`Scraping category: ${category.name}`);
        const categoryResults = { category: category.name, promotions: [] };

        // Navigate to the category page with retry logic
        await safeGoto(page, category.url);

        // Scroll to load all elements
        await autoScroll(page);

        try {
            await page.waitForSelector('.promotion-inner', { timeout: 60000 });

            // Extract promotions
            const promotions = await page.evaluate(() => {
                const promoElements = document.querySelectorAll('.promotion-inner');
                return Array.from(promoElements).map(promo => {
                    const promoLink = promo.querySelector('a')?.href || 'No link';
                    // Select the image within the <figure> tag
                    const imageUrl = promo.querySelector('figure img.img-fluid')?.src || 'No image URL';
                    const title = promo.querySelector('h4 a')?.innerText.trim() || 'No title';
                    const discount = promo.querySelector('.prasentage')?.innerText.trim() || 'No discount';
                    const validity = promo.querySelector('.exp-date')?.innerText.trim() || 'No validity';
                    return { promoLink, imageUrl, title, discount, validity };
                });
            });

            for (const promo of promotions) {
                try {
                    if (promo.promoLink !== 'No link') {
                        await safeGoto(page, promo.promoLink);
                        const promoDetails = await page.evaluate(() => {
                            const merchantCover = document.querySelector('.promotion-inner img')?.src || 'No merchant cover';
                            const merchantName = document.querySelector('.col-md-7.text-md-right h1')?.innerText.trim() || 'No merchant name';
                            const detailsList = Array.from(document.querySelectorAll('.content-ul li')).map(li => li.innerText.trim()).join('\n') || 'No details';
                            return { merchantCover, merchantName, detailsList };
                        });
                        Object.assign(promo, promoDetails);
                    }
                } catch (error) {
                    console.error(`Failed to scrape details for ${promo.promoLink}: ${error.message}`);
                }
            }

            categoryResults.promotions = promotions;
        } catch (error) {
            console.error(`Error scraping category ${category.name}: ${error.message}`);
        }

        results.push(categoryResults);
    }

    await browser.close();
    return results;
}

// Helper function to scroll to the bottom of the page
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            const distance = 200;
            const delay = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                if (window.scrollY + window.innerHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, delay);
        });
    });
}

// Helper function to handle navigation retries
async function safeGoto(page, url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            return;
        } catch (error) {
            console.log(`Retrying navigation to ${url} (${i + 1}/${retries})`);
            if (i === retries - 1) throw error;
        }
    }
}

// Execute the scraper and save results to a CSV file
scrapeDFCCPromotions().then(async results => {
    // Prepare the data for CSV
    const records = [];
    for (const categoryResult of results) {
        const categoryName = categoryResult.category;
        let category_id;
        if (categoryName === 'dining') {
            category_id = 1;
        } else if (categoryName === 'hotels') {
            category_id = 2;
        } else if (categoryName === 'groceries') {
            category_id = 3;
        } else if (categoryName === 'shopping') {
            category_id = 4;
        } else {
            category_id = 4; // Default category ID if not matched
        }

        for (const promo of categoryResult.promotions) {
            const record = {
                bank_id: 7,
                category_id: category_id,
                offer_title: promo.title || '',
                merchant_details: promo.merchantName || '',
                offer_details_1: promo.detailsList || '',
                offer_validity: promo.validity || '',
                discount: promo.discount || '',
                image_url: promo.imageUrl || '',
                more_details_url: promo.promoLink || ''
            };
            records.push(record);
        }
    }

    // Ensure the 'scraped_results' folder exists
    const scrapedResultsDir = path.join(__dirname, 'scraped_results');
    if (!fs.existsSync(scrapedResultsDir)) {
        fs.mkdirSync(scrapedResultsDir);
    }

    // Write the records to the CSV file
    const csvFilePath = path.join(scrapedResultsDir, 'DFCC_data.csv');
    const csvWriter = createCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'bank_id', title: 'bank_id' },
            { id: 'category_id', title: 'category_id' },
            { id: 'offer_title', title: 'offer_title' },
            { id: 'merchant_details', title: 'merchant_details' },
            { id: 'offer_details_1', title: 'offer_details_1' },
            { id: 'offer_validity', title: 'offer_validity' },
            { id: 'discount', title: 'discount' },
            { id: 'image_url', title: 'image_url' },
            { id: 'more_details_url', title: 'more_details_url' }
        ]
    });

    await csvWriter.writeRecords(records);
    console.log(`Results saved to ${csvFilePath}`);
}).catch(error => {
    console.error(`Error during scraping: ${error.message}`);
});
