const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeBOCPromotions() {
    const browser = await puppeteer.launch({
        headless: true, // Set to false to see the browser while scraping
        slowMo: 50,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set desktop viewport dimensions and user-agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    const baseURL = 'https://www.boc.lk';
    const categories = [
        { name: 'dining', urls: [`${baseURL}/personal-banking/card-offers/dining`] },
        { name: 'hotels', urls: [`${baseURL}/personal-banking/card-offers/travel-and-leisure`] },
        { name: 'groceries', urls: [`${baseURL}/personal-banking/card-offers/supermarkets`] },
        { 
            name: 'shopping', 
            urls: [
                `${baseURL}/personal-banking/card-offers/fashion`,
                `${baseURL}/personal-banking/card-offers/online`
            ] 
        }
    ];

    const outputFilePath = path.join(__dirname, 'scraped_results', 'BOC_data.csv');

    // Ensure the scraped_results directory exists
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

    const csvWriter = createCsvWriter({
        path: outputFilePath,
        header: [
            { id: 'bank_id', title: 'bank_id' },
            { id: 'category_id', title: 'category_id' },
            { id: 'offer_title', title: 'offer_title' },
            { id: 'merchant_details', title: 'merchant_details' },
            { id: 'offer_details_1', title: 'offer_details_1' },
            { id: 'offer_validity', title: 'offer_validity' },
            { id: 'discount', title: 'discount' },
            { id: 'image_url', title: 'image_url' },
            { id: 'more_details_url', title: 'more_details_url' },
            { id: 'merchant_contact', title: 'merchant_contact' }
        ]
    });

    const categoryMap = {
        'dining': 1,
        'hotels': 2,
        'groceries': 3,
        'shopping': 4
    };

    console.log('Scraping BOC promotions by category...');
    const records = [];

    for (const category of categories) {
        console.log(`Starting category: ${category.name}`);
        const categoryId = categoryMap[category.name];

        for (const url of category.urls) {
            console.log(`Processing URL: ${url}`);
            await safeGoto(page, url);

            // Click the "Load More" button until all promotions are loaded (if applicable)
            const totalClicks = await loadAllPromotions(page);
            console.log(`"Load More" button clicked ${totalClicks} times for URL: ${url}`);

            // Extract promo links from the main page after all promos are loaded
            const promoLinks = await page.evaluate(() => {
                const promoElements = document.querySelectorAll('a.swiper-slide.product.unique');
                return Array.from(promoElements).map(el => el.href);
            });

            console.log(`Total promotions found in ${category.name} (${url}): ${promoLinks.length}`);

            for (const promoLink of promoLinks) {
                try {
                    await safeGoto(page, promoLink);
                    const promoDetails = await page.evaluate(() => {
                        const merchantCover = document.querySelector('.offer-logo img')?.src || '';
                        const merchantName = document.querySelector('.offer-logo h2')?.innerText.trim() || '';
                        let offerValue = document.querySelector('.offer-value')?.innerText.trim() || '';
                        const validity = document.querySelector('.offer-expire strong')?.innerText.trim() || '';
                        const offerDetailsElements = Array.from(document.querySelectorAll('.expand-block.info-more p'));
                        
                        let offerDetails = '';
                        let merchantContact = '';
                        
                        // Clean up offerValue
                        offerValue = offerValue.endsWith('*') ? offerValue.slice(0, -1) : offerValue;
                        offerValue = offerValue.replace(/\n/g, ' ');
                        
                        offerDetailsElements.forEach(p => {
                            const text = p.innerText.trim();
                            if (text.startsWith('Reservations :')) {
                                merchantContact = text;
                            } else {
                                offerDetails += text + '\n';
                            }
                        });

                        // Remove trailing newline if present
                        offerDetails = offerDetails.trim();

                        return { merchantCover, merchantName, offerValue, validity, offerDetails, merchantContact };
                    });

                    // Add the promo link as detailsURL
                    promoDetails.detailsURL = promoLink;

                    // Map scraped data to CSV record
                    const record = {
                        bank_id: 5,
                        category_id: categoryId,
                        offer_title: `${promoDetails.offerValue} at ${promoDetails.merchantName}`,
                        merchant_details: promoDetails.merchantName,
                        offer_details_1: promoDetails.offerDetails,
                        offer_validity: promoDetails.validity,
                        discount: promoDetails.offerValue,
                        image_url: promoDetails.merchantCover,
                        more_details_url: promoDetails.detailsURL,
                        merchant_contact: promoDetails.merchantContact
                    };

                    // Add the record to the records array
                    records.push(record);
                } catch (error) {
                    console.error(`Failed to scrape promo details from ${promoLink}: ${error.message}`);
                }
            }
            console.log(`Finished scraping URL: ${url} in category: ${category.name}, total promos: ${promoLinks.length}`);
        }
        console.log(`Finished scraping category: ${category.name}`);
    }

    // Write all records to the CSV file
    await csvWriter.writeRecords(records);

    await browser.close();
    console.log(`Scraping complete. Results saved to ${outputFilePath}`);
}

// Helper function to click "Load More" until all promotions are loaded
async function loadAllPromotions(page) {
    let loadMoreVisible = true;
    let clickCount = 0;
    let previousPromoCount = 0;

    while (loadMoreVisible) {
        try {
            console.log('Checking for "Load More" button...');
            await page.waitForSelector('#moreCardOffers', { timeout: 5000, visible: true });

            const isButtonVisible = await page.evaluate(() => {
                const button = document.querySelector('#moreCardOffers');
                return button && button.offsetParent !== null;
            });

            if (isButtonVisible) {
                console.log('"Load More" button is visible, clicking...');
                await page.click('#moreCardOffers');
                clickCount++;
                console.log(`Clicked "Load More" ${clickCount} time(s). Waiting for new content...`);

                // Wait for new content to load
                await page.waitForFunction(
                    (previousCount) => {
                        const promoElements = document.querySelectorAll('a.swiper-slide.product.unique');
                        return promoElements.length > previousCount;
                    },
                    { timeout: 10000 },
                    previousPromoCount
                );

                // Update the previous promo count
                previousPromoCount = await page.evaluate(() => {
                    const promoElements = document.querySelectorAll('a.swiper-slide.product.unique');
                    return promoElements.length;
                });

                console.log(`New promos loaded. Total promos now: ${previousPromoCount}`);
            } else {
                console.log('"Load More" button is no longer visible or clickable.');
                loadMoreVisible = false;
            }
        } catch (error) {
            console.log('"Load More" button not found or all promos are loaded.');
            loadMoreVisible = false;
        }
    }

    console.log(`Finished loading all promotions. Total "Load More" clicks: ${clickCount}`);
    return clickCount;
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

// Helper function to scroll the page to load all dynamic content
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 500);
        });
    });
}

// Execute the scraper
scrapeBOCPromotions().catch(error => {
    console.error(`Error during scraping: ${error.message}`);
});
