const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeCategory(category) {
    console.log(`Scraping category: ${category.name} (${category.url}) ...`);
    const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    const page = await browser.newPage();

    // Set viewport and user-agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    let promotionsData = [];

    try {
        await page.goto(category.url, { waitUntil: 'networkidle2', timeout: 60000 });
        // Wait for the promo cards to appear
        await page.waitForSelector('.col-sm-6.col-md-3', { timeout: 60000 });

        // Get all promo container elements
        const promoHandles = await page.$$('.col-sm-6.col-md-3');

        for (const promo of promoHandles) {
            // Extract data from the main listing
            const imageUrl = await promo.$eval(
                '.merchant-logo-wrap img',
                (img) => img.src
            ).catch(() => '');

            const moreDetailsUrl = await promo.$eval(
                '.offer-content .offer-btn-wrap',
                (a) => a.href
            ).catch(() => '');

            const merchantDetails = await promo.$eval(
                '.offer-content h3',
                (el) => el.innerText.trim()
            ).catch(() => '');

            const discount = await promo.$eval(
                '.offer-content .offer-val',
                (el) => el.innerText.trim()
            ).catch(() => '');

            const validity = await promo.$eval(
                '.offer-content p',
                (el) => el.innerText.trim()
            ).catch(() => '');

            // Open the detail page to scrape additional offer details (leaf <li> items only)
            let offerDetailsText = '';
            if (moreDetailsUrl) {
                const detailPage = await browser.newPage();
                await detailPage.goto(moreDetailsUrl, { waitUntil: 'networkidle2', timeout: 60000 });

                // Gather only leaf <li> elements (those that do NOT contain a nested <ul>)
                const offerDetailsArr = await detailPage.evaluate(() => {
                    const containers = document.querySelectorAll('.single-offer-description');
                    const itemSet = new Set();

                    containers.forEach(container => {
                        const liElems = container.querySelectorAll('li');
                        liElems.forEach(li => {
                            // Only add li text if this li doesn't contain its own <ul>
                            if (!li.querySelector('ul')) {
                                itemSet.add(li.innerText.trim());
                            }
                        });
                    });

                    return Array.from(itemSet);
                });

                // Each <li> on its own line
                offerDetailsText = offerDetailsArr.join('\n');

                await detailPage.close();
            }

            // Build the final promotion object
            promotionsData.push({
                bank_id: 12,                 // Arbitrary ID for Union Bank
                category_id: category.id,
                merchant_details: merchantDetails,
                offer_details_1: offerDetailsText,
                offer_validity: validity,
                discount: discount,
                image_url: imageUrl,
                more_details_url: moreDetailsUrl
            });
        }

        console.log(`Scraped ${promotionsData.length} promotions for category: ${category.name}`);
    } catch (error) {
        console.error(`Error scraping category: ${category.name} - ${error.message}`);
    } finally {
        await browser.close();
    }

    return promotionsData;
}

async function scrapeUnionBankPromotions() {
    // Category mapping for Union Bank
    //   Dining -> 1
    //   Hotels -> 2 (Union calls it "Leisure")
    //   Groceries -> 3
    //   Shopping -> 4 (two URLs: shopping + household-electronics)
    const categories = [
        { name: 'Dining', url: 'https://www.unionb.com/offer-category/dining/', id: 1 },
        { name: 'Hotels', url: 'https://www.unionb.com/offer-category/leisure/', id: 2 },
        { name: 'Groceries', url: 'https://www.unionb.com/offer-category/supermarkets/', id: 3 },
        { name: 'Shopping', url: 'https://www.unionb.com/offer-category/shopping/', id: 4 },
        { name: 'Shopping', url: 'https://www.unionb.com/offer-category/household-electronics/', id: 4 }
    ];

    const csvFilePath = path.join(__dirname, 'scraped_results', 'UnionBank_data.csv');
    const csvDir = path.dirname(csvFilePath);

    if (!fs.existsSync(csvDir)) {
        fs.mkdirSync(csvDir, { recursive: true });
    }

    // Create the CSV writer
    const csvWriterInstance = csvWriter({
        path: csvFilePath,
        header: [
            { id: 'bank_id', title: 'bank_id' },
            { id: 'category_id', title: 'category_id' },
            { id: 'merchant_details', title: 'merchant_details' },
            { id: 'offer_details_1', title: 'offer_details_1' },
            { id: 'offer_validity', title: 'offer_validity' },
            { id: 'discount', title: 'discount' },
            { id: 'image_url', title: 'image_url' },
            { id: 'more_details_url', title: 'more_details_url' }
        ]
    });

    let allData = [];

    // Scrape each category
    for (const category of categories) {
        const categoryPromos = await scrapeCategory(category);
        allData = allData.concat(categoryPromos);
    }

    // Write all data to CSV
    await csvWriterInstance.writeRecords(allData);
    console.log('\nCSV file (UnionBank_data.csv) has been written successfully.');
}

// Run the scraper
scrapeUnionBankPromotions();
