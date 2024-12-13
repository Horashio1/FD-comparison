const puppeteer = require('puppeteer');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeSeylanPromotions() {
    const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    const page = await browser.newPage();

    // Set viewport and user-agent for desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    const categories = [
        { name: 'dining', url: 'https://www.seylan.lk/promotions/cards/dining?page=' },
        { name: 'hotels', url: 'https://www.seylan.lk/promotions/cards/local-travel?page=' },
        { name: 'shopping', url: 'https://www.seylan.lk/promotions/cards/supermarket?page=' },
    ];

    const allResults = {};

    for (const category of categories) {
        console.log(`Starting to scrape category: ${category.name}`);
        let pageNumber = 1;
        const results = [];

        while (true) {
            const url = `${category.url}${pageNumber}`;
            console.log(`Scraping page ${pageNumber}: ${url}`);

            try {
                await page.goto(url, { waitUntil: 'networkidle2' });

                // Check if the "no promotions" message exists
                const noPromotions = await page.$('.card h3');
                if (noPromotions) {
                    const message = await page.evaluate(
                        () => document.querySelector('.card h3').innerText
                    );
                    if (
                        message ===
                        'There are no promotions for this category at the moment'
                    ) {
                        console.log('No promotions found. Ending scraping for this category.');
                        break;
                    }
                }

                // Wait for promotions to load
                await page.waitForSelector('.promotion-item', { timeout: 10000 });

                // Scrape promotions
                const promotions = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('.promotion-item')).map(
                        (item) => {
                            const Title =
                                item.querySelector('.card-title')?.innerText.trim() ||
                                'No title';
                            const detailsLink =
                                item.querySelector('.btn.new-promotion-btn')?.href ||
                                'No details link';
                            return { Title, detailsLink };
                        }
                    );
                });

                // Visit each promotion detail page for additional details
                for (const promo of promotions) {
                    if (promo.detailsLink !== 'No details link') {
                        console.log(`Visiting details page for promo: ${promo.Title}`);
                        await page.goto(promo.detailsLink, { waitUntil: 'networkidle2' });

                        // Extract details from the details page
                        const details = await page.evaluate(() => {
                            const offerDetail = document.querySelector('.offer-detail');

                            const merchantCover =
                                offerDetail.querySelector('.img-fluid')?.src || 'No merchant cover';

                            const Title =
                                offerDetail.querySelector('.h11')?.innerText.trim() || 'No title';

                            const Subheading =
                                offerDetail.querySelector('.col-md-6 > .h44')?.innerText.trim() ||
                                'No subheading';

                            const telNoElement = offerDetail.querySelector('.h44 strong[text="Tel No"]');
                            const Merchant_Details = telNoElement
                                ? telNoElement.parentElement.innerText.trim()
                                : Array.from(offerDetail.querySelectorAll('.h44'))
                                    .find(el => el.innerText.includes('Tel No'))
                                    ?.innerText.trim() || '';

                            const Validity = Array.from(offerDetail.querySelectorAll('p'))
                                .find((p) => p.innerText.toLowerCase().includes('valid'))
                                ?.innerText.trim() || 'No validity';

                            const Promo_details = offerDetail.querySelector('.des')?.innerText.trim()
                                // .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                                // .replace(/\n{3,}/g, '\n\n') || 'No promo details';  // Replace 3+ newlines with 2 newlines

                            return {
                                merchantCover,
                                Title,
                                Subheading,
                                Merchant_Details,
                                Validity,
                                Promo_details,
                            };
                        });

                        // Merge details with the promotion
                        Object.assign(promo, details);
                    }
                }

                // Add promotions to results
                results.push(...promotions);

                console.log(`Scraped ${promotions.length} promotions on page ${pageNumber}`);
                pageNumber++;
            } catch (error) {
                console.error(`Error on page ${pageNumber}: ${error.message}`);
                break;
            }
        }

        // Add the category results to the allResults object
        allResults[category.name] = results;

        console.log(`Finished scraping category: ${category.name}`);
    }

    await browser.close();

    // Collect all promotions into an array
    const allPromotions = [];

    // Map category names to IDs
    const categoryMap = { 'dining': 1, 'hotels': 2, 'shopping': 3 };

    // Loop through each category in allResults
    for (const categoryName in allResults) {
        const categoryPromotions = allResults[categoryName];
        const category_id = categoryMap[categoryName];
        for (const promo of categoryPromotions) {
            const promotion = {
                bank_id: 6,
                category_id: category_id,
                offer_title: promo.Title || '',
                merchant_contact: promo.Merchant_Details || '',
                offer_details_1: promo.Promo_details || '',
                offer_validity: promo.Validity || '',
                discount: promo.Subheading || '',
                image_url: promo.merchantCover || '',
                more_details_url: promo.detailsLink || '',
            };
            allPromotions.push(promotion);
        }
    }

    // Ensure the 'scraped_results' directory exists
    const dir = './scraped_results';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    // Write to CSV file
    const csvWriter = createCsvWriter({
        path: 'scraped_results/Seylan_data.csv',
        header: [
            {id: 'bank_id', title: 'bank_id'},
            {id: 'category_id', title: 'category_id'},
            {id: 'offer_title', title: 'offer_title'},
            {id: 'merchant_contact', title: 'merchant_contact'},
            {id: 'offer_details_1', title: 'offer_details_1'},
            {id: 'offer_validity', title: 'offer_validity'},
            {id: 'discount', title: 'discount'},
            {id: 'image_url', title: 'image_url'},
            {id: 'more_details_url', title: 'more_details_url'},
        ]
    });

    csvWriter.writeRecords(allPromotions)
        .then(() => {
            console.log('CSV file was written successfully to scraped_results/Seylan_data.csv');
        })
        .catch((err) => {
            console.error('Error writing CSV file', err);
        });

    console.log('Scraping task finished!');
}

// Execute the scraper
scrapeSeylanPromotions();
