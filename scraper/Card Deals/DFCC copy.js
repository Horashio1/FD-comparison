const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
        { name: 'restaurants', url: `${baseURL}/promotions-categories/dining` },
        { name: 'hotels', url: `${baseURL}/promotions-categories//hotels` },
        { name: 'shopping', url: `${baseURL}/promotions-categories/supermarket` }
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

// Execute the scraper and save results to a file
scrapeDFCCPromotions().then(results => {
    const filePath = path.join(__dirname, 'promotions_output.txt');
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Results saved to ${filePath}`);
}).catch(error => {
    console.error(`Error during scraping: ${error.message}`);
});
