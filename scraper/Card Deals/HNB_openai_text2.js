const OpenAI = require('openai');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env') });

// Initialize OpenAI API client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const OUTPUT_DIR = path.join(__dirname, 'scraped_results');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'HNB_data.csv');

// Create output directory if not exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Initialize CSV writer
const csvWriter = createCsvWriter({
    path: OUTPUT_FILE,
    header: [
        { id: 'bank_id', title: 'bank_id' },
        { id: 'category_id', title: 'category_id' },
        { id: 'offer_title', title: 'offer_title' },
        { id: 'merchant_details', title: 'merchant_details' },
        { id: 'merchant_contact', title: 'merchant_contact' },
        { id: 'offer_details_1', title: 'offer_details_1' },
        { id: 'offer_details_2', title: 'offer_details_2' },
        { id: 'offer_validity', title: 'offer_validity' },
        { id: 'discount', title: 'discount' },
        { id: 'image_url', title: 'image_url' },
        { id: 'more_details_url', title: 'more_details_url' },
    ],
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
        { name: 'restaurants', url: `${baseURL}/personal/promotions/card-promotions/dining`, categoryId: 1 },
    ];

    const records = [];

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

                records.push({
                    bank_id: 3,
                    category_id: category.categoryId,
                    offer_title: details.title || '',
                    merchant_details: details.merchant || '',
                    merchant_contact: cleanText(details.contacts || ''),
                    offer_details_1: cleanSpecialTerms(details.terms || ''),
                    offer_details_2: cleanText(details.contacts || ''),
                    offer_validity: details.period || '',
                    discount: details.offer || '',
                    image_url: details.image || '',
                    more_details_url: promoDetailsURL,
                });
            }
        } catch (error) {
            console.error(`Error scraping ${category.name} promotions: ${error.message}`);
        }
    }

    await browser.close();

    // Write results to CSV
    await csvWriter.writeRecords(records);
    console.log(`Results saved to ${OUTPUT_FILE}`);
    return records;
}

async function fetchPromoDetails(browser, url, baseURL) {
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.col-md-9.hnbcp-offer-more-description.offerdesc', { timeout: 60000 });

        const htmlContent = await page.evaluate(() => {
            const detailsDiv = document.querySelector('.col-md-9.hnbcp-offer-more-description.offerdesc');
            return detailsDiv ? detailsDiv.outerHTML : null;
        });

        if (!htmlContent) {
            console.warn(`No content found on the page: ${url}`);
            return {
                title: 'Missing details',
                merchant: 'Missing merchant',
                offer: 'Missing offer',
                period: 'Missing period',
                terms: null,
                contacts: 'Missing contacts',
                image: 'No image',
            };
        }

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
            terms: null,
            contacts: 'Error extracting contacts',
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
                    - contacts: any contact information provided.
                    - terms: Special terms and conditions, excluding General terms.`,
                },
                { role: 'user', content: htmlContent },
            ],
        });

        const rawContent = response.choices[0].message.content.trim();

        // Remove Markdown code fences if present
        const jsonString = rawContent.replace(/```json|```/g, '');

        return JSON.parse(jsonString);
    } catch (error) {
        console.error(`Error using OpenAI API: ${error.message}`);
        return {
            title: 'Error extracting title',
            merchant: 'Error extracting merchant',
            offer: 'Error extracting offer',
            period: 'Error extracting period',
            terms: null,
            contacts: 'Error extracting contacts',
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

// Utility function to clean text by removing object notations
function cleanText(data) {
    if (Array.isArray(data)) {
        return data.join('\n');
    } else if (typeof data === 'object') {
        return Object.values(data).flat().join('\n');
    }
    return data;
}

// Utility function to clean and exclude "special terms" from terms
function cleanSpecialTerms(terms) {
    if (terms && typeof terms === 'object' && Array.isArray(terms.special_terms)) {
        return terms.special_terms.join('\n');
    } else if (terms && typeof terms === 'string') {
        return terms.split('Special terms')[0].trim(); // Remove general terms
    }
    return ''; // Fallback to an empty string if terms are missing or invalid
}

// Execute the scraper
scrapeHNBPromotions();
