const OpenAI = require('openai');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env') });

// Initialize OpenAI API client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function scrapeHNBPromotions() {
    const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    const baseURL = 'https://www.hnb.net';
    const categories = [
        { name: 'restaurants', url: `${baseURL}/personal/promotions/card-promotions/dining` },
    ];

    const results = { restaurants: [] };

    for (const category of categories) {
        try {
            console.log(`Scraping ${category.name} promotions from: ${category.url}`);
            await page.goto(category.url, { waitUntil: 'networkidle2', timeout: 60000 });
            await autoScroll(page);

            await page.waitForSelector('.hnbcp-offer-block', { timeout: 60000 });

            const promos = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.hnbcp-offer-block')).map(promo => {
                    const detailsLink =
                        promo.querySelector('a.btn-def.hnbcp-offer-btn')?.getAttribute('href') || 'No details link';
                    return { detailsLink };
                });
            });

            for (let i = 0; i < Math.min(10, promos.length); i++) {
                const promo = promos[i];
                const promoDetailsURL = `${baseURL}${promo.detailsLink}`;
                const details = await fetchPromoDetails(browser, promoDetailsURL, baseURL);

                results[category.name].push({
                    ...details,
                    detailsURL: promoDetailsURL,
                });
            }
        } catch (error) {
            console.error(`Error scraping ${category.name} promotions: ${error.message}`);
        }
    }

    await browser.close();
    return results;
}

async function fetchPromoDetails(browser, url, baseURL) {
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.col-md-9.hnbcp-offer-more-description.offerdesc', { timeout: 60000 });

        const htmlContent = await page.evaluate(() => {
            const detailsDiv = document.querySelector('.col-md-9.hnbcp-offer-more-description.offerdesc');
            return detailsDiv ? detailsDiv.outerHTML : 'No content';
        });

        const extractedText = await extractTextUsingOpenAI(htmlContent);

        const image = await page.evaluate(() => {
            const imageElement = document.querySelector('.hnbcp-offer-logo-holder img');
            return imageElement ? imageElement.getAttribute('src') : null;
        });

        return {
            ...extractedText,
            image: image ? `${baseURL}${image}` : 'No image',
        };
    } catch (error) {
        console.error(`Error fetching details from ${url}: ${error.message}`);
        return {
            title: 'Error extracting title',
            merchant: 'Error extracting merchant',
            offer: 'Error extracting offer',
            period: 'Error extracting period',
            eligibility: 'Error extracting eligibility',
            contacts: 'Error extracting contacts',
            locations: 'Error extracting locations',
            terms: 'Error extracting terms',
            image: 'No image',
        };
    } finally {
        await page.close();
    }
}

async function extractTextUsingOpenAI(htmlContent) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `Extract the following details as JSON:
                    - title: the promotion title.
                    - merchant: the name of the merchant.
                    - offer: a brief description of the offer.
                    - period: the validity period of the offer.
                    - eligibility: the eligibility criteria.
                    - contacts: any contact information provided.
                    - locations: the locations where the offer is valid, which can be single or multiple locations.
                    - terms: Special terms and conditions of the offer, excluding the General terms.`,
                },
                { role: 'user', content: htmlContent },
            ],
        });

        const rawContent = response.choices[0].message.content.trim();

        // Remove Markdown code fences if present
        const jsonString = rawContent.replace(/```json|```/g, '');

        const tokenCount = response.usage.total_tokens;
        const cost = (tokenCount / 1000) * 0.015; // Adjust cost for GPT-3.5-turbo
        console.log(`Tokens used: ${tokenCount}, Cost: $${cost.toFixed(4)}`);

        return JSON.parse(jsonString);
    } catch (error) {
        console.error(`Error using OpenAI API: ${error.message}`);
        return {
            title: 'Error extracting title',
            merchant: 'Error extracting merchant',
            offer: 'Error extracting offer',
            period: 'Error extracting period',
            eligibility: 'Error extracting eligibility',
            contacts: 'Error extracting contacts',
            locations: 'Error extracting locations',
            terms: 'Error extracting terms',
        };
    }
}


async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise(resolve => {
            const distance = 200;
            const delay = 100;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, delay);
        });
    });
}

// Execute the scraper and save results to a file
scrapeHNBPromotions().then(results => {
    const filePath = path.join(__dirname, 'HNB_results_2.txt');
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Results saved to ${filePath}`);
});

