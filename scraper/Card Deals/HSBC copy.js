const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeHSBCPromotions() {
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

    // Define the HSBC base URL
    const baseURL = 'https://www.hsbc.lk'; // Replace with the actual base URL if different

    // Define the promotion categories and their URLs
    const categories = [
        { name: 'dining', url: `${baseURL}/credit-cards/offers/wine-and-dine/` },
        { name: 'hotels', url: `${baseURL}/credit-cards/offers/local-holidays/` },
        { name: 'groceries', url: `${baseURL}/credit-cards/offers/daily-essentials/` },
        { name: 'shopping', url: `${baseURL}/credit-cards/offers/shopping/` },
    ];

    // Define the output file path
    const outputFilePath = path.join(__dirname, 'promotions.json');

    // Initialize an object to hold all promotion records segregated by category
    const allPromotions = {};

    console.log('Starting HSBC promotions scraping...');

    try {
        // Iterate over each category
        for (const category of categories) {
            console.log(`\nScraping category: ${category.name}`);
            const promotions = []; // Array to hold promotions for the current category

            try {
                // Navigate to the current category's promotions page
                await safeGoto(page, category.url);

                // Wait for the promotion modules to load
                await page.waitForSelector('.productModule', { timeout: 60000 });

                // Scroll to the bottom to ensure all dynamic content is loaded
                await autoScroll(page);

                // Select all promotion modules
                const promoModules = await page.$$('.productModule');

                console.log(`Found ${promoModules.length} promotions in category: ${category.name}`);

                for (let i = 0; i < promoModules.length; i++) {
                    const promo = promoModules[i];

                    // Scroll the promo module into view
                    await promo.evaluate(el => el.scrollIntoView());

                    // Extract merchant details
                    let merchantDetails = '';
                    try {
                        merchantDetails = await promo.$eval('h3.A-LNKND38L-RW-ALL', el => el.innerText.trim());
                    } catch (error) {
                        console.error(`Error extracting merchant_details for promo ${i + 1} in ${category.name}:`, error.message);
                        merchantDetails = 'N/A';
                    }

                    // Extract merchant locations
                    let merchantLocations = '';
                    try {
                        // Updated selector to handle both <p> tags and direct text
                        merchantLocations = await promo.$$eval('div.A-TYP16R-RW-ALL', elements =>
                            elements.map(el => el.innerText.trim()).join('\n')
                        );
                    } catch (error) {
                        console.error(`Error extracting merchant_locations for promo ${i + 1} in ${category.name}:`, error.message);
                        merchantLocations = 'N/A';
                    }

                    // Extract discount and validity
                    let discount = 'N/A';
                    let validity = 'N/A';
                    try {
                        // Extract all paragraphs within .first-facts
                        const paragraphs = await promo.$$eval('.first-facts p', elements =>
                            elements.map(el => el.innerText.trim())
                        );

                        // Find 'Offer:' and 'Validity:' indices
                        const offerIndex = paragraphs.findIndex(text => text.startsWith('Offer:'));
                        if (offerIndex !== -1 && paragraphs.length > offerIndex + 2) {
                            discount = paragraphs[offerIndex + 2];
                        }

                        const validityIndex = paragraphs.findIndex(text => text.startsWith('Validity:'));
                        if (validityIndex !== -1 && paragraphs.length > validityIndex + 2) {
                            validity = paragraphs[validityIndex + 2];
                        }
                    } catch (error) {
                        console.error(`Error extracting discount and validity for promo ${i + 1} in ${category.name}:`, error.message);
                    }

                    // Extract image URL
                    let imageUrl = '';
                    try {
                        imageUrl = await promo.$eval('img.smart-image-img', img => img.getAttribute('src'));
                        // Handle relative URLs by prepending the base URL
                        if (imageUrl.startsWith('/')) {
                            const urlObj = new URL(baseURL);
                            imageUrl = `${urlObj.origin}${imageUrl}`;
                        }
                    } catch (error) {
                        console.error(`Error extracting imageUrl for promo ${i + 1} in ${category.name}:`, error.message);
                        imageUrl = 'N/A';
                    }

                    // Click to expand Terms and Conditions to extract offer_details_1
                    try {
                        const termsButton = await promo.$('div.A-EXPCNT-RW-RBWM.expander .dropdown');
                        if (termsButton) {
                            // Check if it's already expanded
                            const ariaExpanded = await termsButton.evaluate(el => el.getAttribute('aria-expanded'));
                            if (ariaExpanded !== 'true') {
                                await termsButton.click();
                                // Wait for the content to expand
                                if (page.waitForTimeout) {
                                    await page.waitForTimeout(500); // 500 milliseconds
                                } else {
                                    await new Promise(resolve => setTimeout(resolve, 500)); // Fallback for older Puppeteer versions
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error clicking Terms and Conditions for promo ${i + 1} in ${category.name}:`, error.message);
                    }

                    // Extract offer details from Terms and Conditions
                    let offerDetails = '';
                    try {
                        offerDetails = await promo.$$eval('section.exp-content.expanded ul.A-LSTU-RW-ALL li', elements =>
                            elements.map(el => el.innerText.trim()).join('\n')
                        );
                    } catch (error) {
                        console.error(`Error extracting offer_details_1 for promo ${i + 1} in ${category.name}:`, error.message);
                        offerDetails = 'N/A';
                    }

                    // Compile the promo data with the new 'more_details_url' field
                    const promoData = {
                        merchant_details: merchantDetails,
                        merchant_locations: merchantLocations,
                        offer_details_1: offerDetails,
                        discount: discount,
                        validity: validity,
                        imageUrl: imageUrl,
                        more_details_url: category.url // New field added
                    };

                    // Add the promo data to the promotions array for the current category
                    promotions.push(promoData);
                }

                // Add the promotions array to the allPromotions object under the current category name
                allPromotions[category.name] = promotions;

                // Log the number of promos scraped for the current category
                console.log(`Scraped ${promotions.length} promotions for category: ${category.name}`);
            } catch (categoryError) {
                console.error(`Error scraping category ${category.name}:`, categoryError.message);
            }
        }
    } catch (error) {
        console.error('An error occurred during scraping:', error.message);
    } finally {
        // Convert the allPromotions object to JSON string with indentation
        const jsonContent = JSON.stringify(allPromotions, null, 2);

        // Write the JSON content to the promotions.json file
        fs.writeFileSync(outputFilePath, jsonContent, 'utf8');

        console.log(`\nScraping complete. Data saved to ${outputFilePath}`);

        // Close the browser
        await browser.close();
    }
}

// Helper function to handle navigation retries
async function safeGoto(page, url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            return;
        } catch (error) {
            console.error(`Navigation to ${url} failed on attempt ${i + 1}:`, error.message);
            if (i === retries - 1) throw error;
            console.log(`Retrying navigation to ${url}...`);
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

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

// Execute the scraper
scrapeHSBCPromotions().catch(error => {
    console.error(`Error during scraping: ${error.message}`);
});
