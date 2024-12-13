const puppeteer = require('puppeteer');

async function scrapeSampathPromotions() {
    const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    const page = await browser.newPage();

    // Set desktop viewport dimensions
    await page.setViewport({ width: 1920, height: 1080 });

    // Set a desktop user-agent
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    // Define categories and their URLs
    const categories = {
        dining: 'https://www.sampath.lk/sampath-cards/credit-card-offer?firstTab=dining',
        supermarkets: 'https://www.sampath.lk/sampath-cards/credit-card-offer?firstTab=super_markets',
        hotels: 'https://www.sampath.lk/sampath-cards/credit-card-offer?firstTab=hotels'
    };

    const results = [];

    for (const [category, url] of Object.entries(categories)) {
        console.log(`Scraping category: ${category}`);

        // Navigate to the category URL
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Scroll to load all elements
        await autoScroll(page);

        // Wait for the parent container of promotions
        try {
            await page.waitForSelector('.row.media-news-wrap', { timeout: 60000 });

            // Extract promotion details
            const promotions = await page.evaluate(() => {
                const promoContainer = document.querySelector('.row.media-news-wrap');
                if (!promoContainer) return [];

                const promoElements = promoContainer.querySelectorAll('.card-offer-block');
                return Array.from(promoElements).map(card => {
                    const imageUrl = card.querySelector('.img-wrap img')?.src || 'No image URL';
                    const discount = card.querySelector('.discount p')?.innerText || 'No discount';
                    const merchant = card.querySelector('.place')?.innerText?.trim() || 'No merchant information';
                    const validity = card.querySelector('.date')?.innerText?.replace('Valid till', '').trim() || 'No validity';
                    const contact = card.querySelector('.contact')?.innerText?.replace('Contact No:', '').trim() || 'No contact information';
                    const moreDetailsUrl = card.querySelector('a')?.href || 'No more details URL';

                    // Capture all <p> tags inside the card-name class
                    const details = Array.from(card.querySelectorAll('.card-name p')).map(p => p.innerText.trim()).join('\n') || 'No details';

                    return {
                        imageUrl,
                        discount,
                        merchant,
                        validity,
                        details,
                        contact,
                        moreDetailsUrl
                    };
                });
            });

            // Add the scraped data to results
            results.push({ category, promotions });

            console.log(`Scraped ${promotions.length} promotions for ${category}`);
        } catch (error) {
            console.error(`Failed to scrape ${category}: ${error.message}`);
        }
    }

    // Log the results
    console.log('======================');
    console.log('  Scraped Promotions  ');
    console.log('======================');
    console.log(JSON.stringify(results, null, 2));

    // Close the browser
    await browser.close();

    return results;
}

// Helper function to scroll to the bottom of the page
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            const distance = 200; // Scroll step
            const delay = 100; // Delay between steps in ms
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

// Execute the async function
scrapeSampathPromotions().then(results => {
    console.log('Scraping completed!');
});
