const puppeteer = require('puppeteer');
const fs = require('fs');

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

                            const merchantDetailsElement = offerDetail.querySelector('.col-md-6 > .h44 strong');
                            const Merchant_Details = merchantDetailsElement
                                ? merchantDetailsElement.parentNode.innerText.replace('Tel No :', '').trim()
                                : 'No merchant details';

                            const Validity = Array.from(offerDetail.querySelectorAll('p'))
                                .find((p) => p.innerText.toLowerCase().includes('valid'))
                                ?.innerText.trim() || 'No validity';

                            const Promo_details =
                                offerDetail.querySelector('.des')?.innerText.trim() || 'No promo details';

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

    // Write results to JSON file
    fs.writeFileSync('results.json', JSON.stringify(allResults, null, 2));
    console.log('Scraping task finished! Results saved to results.json');
}

// Execute the scraper
scrapeSeylanPromotions();
