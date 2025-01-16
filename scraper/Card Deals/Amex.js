const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Define starting and stopping phrases for offer_details_2 extraction
const START_PHRASES = [
    'special terms and conditions',
    'special terms & conditions',
    'terms and conditions',
    'terms & conditions'
];

const STOP_PHRASES = [
    'general terms',
    'general terms & conditions',
    'general terms and conditions',
    'terms & conditions - clothing',
    'terms & conditions - dining',
    'terms & conditions - supermarket',
    'terms & conditions - lodging',
    'terms and conditions - clothing',
    'terms and conditions - dining',
    'terms and conditions - supermarket',
    'terms and conditions - lodging',
    'general terms & conditions - supermarket',
    'general terms & conditions - dining',
    'general terms & conditions-dining',
    'general terms & conditions - lodging',
    'general terms & conditions - clothing',
    'general terms and conditions - supermarket',
    'general terms and conditions - dining',
    'general terms and conditions-dining',
    'general terms and conditions - lodging',
    'general terms and conditions - clothing'
];

// Define categories with their respective URLs, IDs, and whether to skip featured promos
const categories = [
    { 
        name: 'dining', 
        url: 'https://www.americanexpress.lk/en/offers/dining-offers', 
        category_id: 1,
        skipFeatured: true
    },
    { 
        name: 'hotels', 
        url: 'https://www.americanexpress.lk/en/offers/lodging-offers', 
        category_id: 2,
        skipFeatured: true
    },
    { 
        name: 'groceries', 
        url: 'https://www.americanexpress.lk/en/offers/supermarket-offers', 
        category_id: 3,
        skipFeatured: false // Do not skip featured promos
    },
    { 
        name: 'shopping', 
        url: 'https://www.americanexpress.lk/en/offers/clothing-offers', 
        category_id: 4,
        skipFeatured: true
    },
    // Add more categories here if needed in the future
];

async function scrapeAmexPromotions(page) {
    const records = [];
    console.log('Starting Amex promotions scraping...');

    for (const category of categories) {
        console.log(`\nProcessing category: ${category.name}`);
        const categoryId = category.category_id;

        try {
            await safeGoto(page, category.url);

            // Scroll to the bottom to ensure all lazy-loaded images or elements are loaded
            await autoScroll(page);

            let promoBoxes = [];

            if (category.skipFeatured) {
                // For categories that require skipping featured promos
                promoBoxes = await page.$$eval('.col-sm-6.col-md-4.col-lg-2.alloffer-box', boxes => {
                    return boxes.map(box => {
                        // Select the anchor tag that contains the promo details
                        const promoLinkElement = box.querySelector('a.alloffer-box-inner');
                        if (!promoLinkElement) return null; // Skip if promo link is not found
                
                        // Extract discount text from .value-limit span
                        const discountElement = box.querySelector('.value-limit span');
                        const discount = discountElement ? discountElement.innerText.trim() : '';
                
                        // Merchant name or heading
                        const merchantElement = box.querySelector('.alloffer-heading');
                        const merchantName = merchantElement ? merchantElement.innerText.trim() : '';
                
                        // Validity text - assuming it's the last div inside .alloffer-text
                        const validityElements = box.querySelectorAll('.alloffer-text div');
                        const validityText = validityElements.length > 0 ? validityElements[validityElements.length - 1].innerText.trim() : '';
                
                        // Build full promo URL
                        const promoLink = promoLinkElement.getAttribute('href');
                        const fullPromoLink = promoLink.startsWith('http') ? promoLink : `https://www.americanexpress.lk${promoLink}`;
                
                        return { discount, merchantName, validity: validityText, promoLink: fullPromoLink };
                    }).filter(promo => promo !== null); // Filter out null results
                });
                
            } else {
                // For categories that do not require skipping featured promos (e.g., groceries)
                promoBoxes = await page.$$eval('.col-sm-6.col-md-4.col-lg-2.alloffer-box', boxes => {
                    return boxes.map(box => {
                        // Select the anchor tag that contains the promo details
                        const promoLinkElement = box.querySelector('a.alloffer-box-inner');
                        if (!promoLinkElement) return null; // Skip if promo link is not found
                
                        // Extract discount text from .value-limit span
                        const discountElement = box.querySelector('.value-limit span');
                        const discount = discountElement ? discountElement.innerText.trim() : '';
                
                        // Merchant name or heading
                        const merchantElement = box.querySelector('.alloffer-heading');
                        const merchantName = merchantElement ? merchantElement.innerText.trim() : '';
                
                        // Validity text - assuming it's the last div inside .alloffer-text
                        const validityElements = box.querySelectorAll('.alloffer-text div');
                        const validityText = validityElements.length > 0 ? validityElements[validityElements.length - 1].innerText.trim() : '';
                
                        // Build full promo URL
                        const promoLink = promoLinkElement.getAttribute('href');
                        const fullPromoLink = promoLink.startsWith('http') ? promoLink : `https://www.americanexpress.lk${promoLink}`;
                
                        return { discount, merchantName, validity: validityText, promoLink: fullPromoLink };
                    }).filter(promo => promo !== null); // Filter out null results
                });
            }

            console.log(`Found ${promoBoxes.length} promotions in category: ${category.name}`);

            // --------------------------
            // Promo Limit Configuration
            // --------------------------
            // Uncomment the following lines to set a limit on the number of promotions per category
            // const promoLimit = 5;
            // const limitedPromoBoxes = promoBoxes.slice(0, promoLimit);

            // Uncomment the follow line to have  no limit applied
            const limitedPromoBoxes = promoBoxes;

            console.log(`Processing the first ${limitedPromoBoxes.length} promotions.`);

            // Initialize a counter for the number of scraped promotions in this category
            let categoryScrapedCount = 0;

            for (const promo of limitedPromoBoxes) {
                try {
                    // Navigate to the promotion's detailed page
                    await safeGoto(page, promo.promoLink);

                    // Wait for the necessary selectors to load
                    await page.waitForSelector('.col-md-4.offerdetail-img img', { timeout: 10000 });

                    // Extract details from the promo page
                    const promoDetails = await page.evaluate((startPhrases, stopPhrases) => {
                        // Merchant Image
                        const imageElement = document.querySelector('.col-md-4.offerdetail-img img');
                        const imageUrl = imageElement ? imageElement.src.trim() : '';

                        // **Modified Extraction for Offer Details 1**
                        const offerDetails1Element = document.querySelector('.col-md-6.offerdetail-text');
                        let offerDetails1 = '';
                        if (offerDetails1Element) {
                            // Iterate through all child elements and concatenate their text with line breaks
                            offerDetails1 = Array.from(offerDetails1Element.children)
                                .map(child => child.innerText.trim())
                                .filter(text => text) // Remove empty texts to avoid consecutive empty lines
                                .join('\n\n'); // Use double newline for separation
                        }

                        // Offer Details 2 (Existing logic remains unchanged)
                        const offerDetails2Container = document.querySelector('.col-md-12.offerdetail-text');
                        let offerDetails2 = '';
                        if (offerDetails2Container) {
                            // Find any element containing exactly the start phrases
                            const specialTermsElement = Array.from(offerDetails2Container.querySelectorAll('*')).find(elem => {
                                const text = elem.innerText.toLowerCase().trim();
                                return startPhrases.some(start => text === start);
                            });

                            if (specialTermsElement) {
                                // Initialize an array to hold the terms
                                const terms = [];

                                // Start traversing siblings after the specialTermsElement
                                let nextSibling = specialTermsElement.nextElementSibling;

                                while (nextSibling && !stopPhrases.some(stop => nextSibling.innerText.toLowerCase().trim() === stop)) {
                                    if (nextSibling.tagName.toLowerCase() === 'ul') {
                                        // Extract text from each <li> in the <ul>
                                        const listItems = Array.from(nextSibling.querySelectorAll('li')).map(li => li.innerText.trim());
                                        terms.push(...listItems);
                                    } else if (nextSibling.tagName.toLowerCase() === 'p') {
                                        // Sometimes, terms might be in <p> tags as well
                                        terms.push(nextSibling.innerText.trim());
                                    } else if (nextSibling.tagName.toLowerCase() === 'div') {
                                        // Handle cases where terms are within <div> tags
                                        const divText = nextSibling.innerText.trim();
                                        if (divText) {
                                            terms.push(divText);
                                        }
                                    }
                                    nextSibling = nextSibling.nextElementSibling;
                                }

                                // Join the terms with newline characters
                                offerDetails2 = terms.join('\n');
                            }
                        }

                        // Merchant Contact (Assuming it's mentioned in the offer details)
                        let merchantContact = '';
                        const contactMatch = offerDetails1.match(/call\s*[:\-]?\s*([\d\s]+)/i);
                        if (contactMatch && contactMatch[1]) {
                            merchantContact = contactMatch[1].replace(/\s+/g, '');
                        }

                        return { imageUrl, offerDetails1, offerDetails2, merchantContact };
                    }, START_PHRASES, STOP_PHRASES);

                    // Construct the offer title
                    const offerTitle = `${promo.discount} at ${promo.merchantName}`;

                    // Create the record object
                    const record = {
                        bank_id: 10, // Updated bank_id as per your requirement
                        category_id: categoryId,
                        offer_title: offerTitle,
                        merchant_details: promo.merchantName,
                        offer_details_1: promoDetails.offerDetails1,
                        offer_details_2: promoDetails.offerDetails2 || null, // Assign null if empty
                        offer_validity: promo.validity,
                        discount: promo.discount,
                        image_url: promoDetails.imageUrl,
                        more_details_url: promo.promoLink,
                        merchant_contact: promoDetails.merchantContact
                    };

                    records.push(record);
                    categoryScrapedCount++;
                    // Removed per-promo console.log
                } catch (promoError) {
                    console.error(`Failed to scrape promo at ${promo.promoLink}: ${promoError.message}`);
                }
            }

            // Log the total number of scraped promotions for this category
            console.log(`Scraped ${categoryScrapedCount} promotions for category: ${category.name}`);
            console.log(`Completed scraping category: ${category.name}`);
        } catch (categoryError) {
            console.error(`Failed to process category ${category.name}: ${categoryError.message}`);
        }
    }

    return records;
}

// --------------------------
// CSV Writing Function Using csv-writer
// --------------------------
async function writeCSV(records, outputFilePath) {
    if (records.length === 0) {
        console.warn('No records to write to CSV.');
        return;
    }

    const csvWriter = createCsvWriter({
        path: outputFilePath,
        header: [
            {id: 'bank_id', title: 'bank_id'},
            {id: 'category_id', title: 'category_id'},
            {id: 'offer_title', title: 'offer_title'},
            {id: 'merchant_details', title: 'merchant_details'},
            {id: 'offer_details_1', title: 'offer_details_1'},
            {id: 'offer_details_2', title: 'offer_details_2'},
            {id: 'offer_validity', title: 'offer_validity'},
            {id: 'discount', title: 'discount'},
            {id: 'image_url', title: 'image_url'},
            {id: 'more_details_url', title: 'more_details_url'},
            {id: 'merchant_contact', title: 'merchant_contact'}
        ]
    });

    try {
        await csvWriter.writeRecords(records);
        console.log(`\nScraping complete. Results saved to ${outputFilePath}`);
    } catch (error) {
        console.error(`Failed to write CSV file: ${error.message}`);
    }
}

// --------------------------
// Execute the scraper and write CSV
// --------------------------
(async () => {
    const browser = await puppeteer.launch({
        headless: true, // Set to false if you want to see the browser in action
        slowMo: 50,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport and user-agent for consistency
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/119.0.3945.88 Safari/537.36'
    );

    // Define output directory and file path
    const outputDir = path.join(__dirname, 'scraped_results');
    const outputFilePath = path.join(outputDir, 'Amex_data.csv');

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }

    try {
        const records = await scrapeAmexPromotions(page);
        await writeCSV(records, outputFilePath);
    } catch (error) {
        console.error(`An error occurred during scraping: ${error.message}`);
    } finally {
        await browser.close();
    }
})();

// Helper function to handle navigation with retries
async function safeGoto(page, url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            return;
        } catch (error) {
            console.warn(`Attempt ${attempt} to navigate to ${url} failed: ${error.message}`);
            if (attempt === retries) {
                throw new Error(`Failed to navigate to ${url} after ${retries} attempts`);
            }
            // Wait before retrying
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}

// Helper function to auto-scroll the page to load dynamic content
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}
