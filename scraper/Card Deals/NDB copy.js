const puppeteer = require('puppeteer');

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
                const coverImage = card.querySelector('.ant-image img')?.src || 'No cover image';
                const merchantImage = card.querySelector('.ant-card-meta-avatar img')?.src || 'No merchant image';
                const merchantName = card.querySelector('.ant-card-meta-title')?.innerText || 'No merchant name';
                const promoDetails = card.querySelector('.PromotionMobile_details__z7myj h5')?.innerText || 'No promo details';
                const validity = card.querySelector('.PromotionMobile_validity__39zdc span')?.innerText || 'No validity information';
                const merchantDetails = card.querySelector('.PromotionMobile_merchantDescription__1BkVS span')?.innerText || 'No merchant details';
                const merchantPhone = Array.from(card.querySelectorAll('.PromotionMobile_merchantDescription__1BkVS li')).map(li => li.innerText).join(', ') || 'No phone number';

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
        { name: 'Shopping', url: 'https://www.ndbbank.com/cards/card-offers/supermarkets' },
        { name: 'Dining', url: 'https://www.ndbbank.com/cards/card-offers/restaurants-pubs' },
        { name: 'Hotels', url: 'https://www.ndbbank.com/cards/card-offers/hotels-villas' }
    ];

    const allPromotions = {};

    for (const category of categories) {
        const result = await scrapeCategory(category.name, category.url);
        allPromotions[category.name] = result.promotions;
    }

    console.log('Final JSON:');
    console.log(JSON.stringify(allPromotions, null, 2));
}

scrapeNDBPromotions();
