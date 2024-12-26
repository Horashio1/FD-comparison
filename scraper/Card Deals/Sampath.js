const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

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
        groceries: 'https://www.sampath.lk/sampath-cards/credit-card-offer?firstTab=super_markets',
        hotels: 'https://www.sampath.lk/sampath-cards/credit-card-offer?firstTab=hotels',
        shopping: 'https://www.sampath.lk/sampath-cards/credit-card-offer?firstTab=fashion'
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
                    const imageUrl = card.querySelector('.img-wrap img')?.src || '';
                    const discount = card.querySelector('.discount p')?.innerText || '';
                    const merchant = card.querySelector('.place')?.innerText?.trim() || '';
                    const validity = card.querySelector('.date')?.innerText?.replace('Valid till', '').trim() || '';
                    const contact = card.querySelector('.contact')?.innerText?.replace('Contact No:', '').trim() || '';
                    const moreDetailsUrl = card.querySelector('a')?.href || '';

                    // Capture all <p> tags inside the card-name class
                    const details = Array.from(card.querySelectorAll('.card-name p')).map(p => p.innerText.trim()).join('\n') || '';

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
            promotions.forEach(promotion => {
                results.push({
                    bank_id: 2,
                    category_id: category === 'dining' ? 1 : category === 'hotels' ? 2 : category === 'groceries' ? 3 : category === 'shopping' ? 4 : 0,
                    offer_title: `${promotion.discount} at ${promotion.merchant}`,
                    merchant_details: promotion.merchant,
                    offer_details_1: promotion.details,
                    offer_details_2: promotion.contact || null,
                    offer_validity: promotion.validity,
                    discount: promotion.discount,
                    image_url: promotion.imageUrl,
                    more_details_url: promotion.moreDetailsUrl
                });
            });

            console.log(`Scraped ${promotions.length} promotions for ${category}`);
        } catch (error) {
            console.error(`Failed to scrape ${category}: ${error.message}`);
        }
    }

    // Write results to CSV
    const csvWriter = createObjectCsvWriter({
        path: path.join(__dirname, 'scraped_results', 'Sampath_data.csv'),
        header: [
            { id: 'bank_id', title: 'bank_id' },
            { id: 'category_id', title: 'category_id' },
            { id: 'offer_title', title: 'offer_title' },
            { id: 'merchant_details', title: 'merchant_details' },
            { id: 'offer_details_1', title: 'offer_details_1' },
            { id: 'offer_details_2', title: 'offer_details_2' },
            { id: 'offer_validity', title: 'offer_validity' },
            { id: 'discount', title: 'discount' },
            { id: 'image_url', title: 'image_url' },
            { id: 'more_details_url', title: 'more_details_url' }
        ]
    });

    try {
        // Ensure the directory exists
        fs.mkdirSync(path.join(__dirname, 'scraped_results'), { recursive: true });

        await csvWriter.writeRecords(results);
        console.log('Data successfully written to Sampath_data.csv');
    } catch (err) {
        console.error('Error writing to CSV:', err);
    }

    // Close the browser
    await browser.close();
}

// Helper function to scroll to the bottom of the page
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            const distance = 200; // Scroll step
            const delay = 300; // Delay between steps in ms
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
scrapeSampathPromotions().then(() => {
    console.log('Scraping completed!');
});
