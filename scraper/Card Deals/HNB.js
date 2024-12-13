const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeHNBPromotions() {
    const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
    );

    const baseURL = 'https://www.hnb.net';
    const categories = [
        { name: 'dining', url: `${baseURL}/personal/promotions/card-promotions/dining` },
        { name: 'hotels', url: `${baseURL}/personal/promotions/card-promotions/hotels` },
        { name: 'shopping', url: `${baseURL}/personal/promotions/card-promotions/shopping` },
    ];

    const results = { dining: [], hotels: [], shopping: [] };

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
                    return {
                        detailsLink,
                    };
                });
            });

            for (const promo of promos) {
                const promoDetailsURL = `${baseURL}${promo.detailsLink}`;
                const details = await fetchPromoDetails(browser, promoDetailsURL, baseURL);

                results[category.name].push({
                    detailsURL: promoDetailsURL,
                    ...details,
                });
            }

            console.log(`Scraped ${results[category.name].length} promotions for ${category.name}.`);

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

        const details = await page.evaluate(() => {
            const detailsDiv = document.querySelector('.col-md-9.hnbcp-offer-more-description.offerdesc');
            const fields = {};

            // Extract title
            fields.title = detailsDiv.querySelector('h1.hnbcp-offer-inner-heading')?.innerText.trim() || 'No title';

            // Function to extract fields like merchant, offer, period, eligibility
            function extractField(labelRegex, defaultValue = '') {
                const labelElement = Array.from(detailsDiv.querySelectorAll('div, p, span, strong, b')).find(el => {
                    return labelRegex.test(el.textContent.trim());
                });
                if (labelElement) {
                    let content = labelElement.textContent.replace(labelRegex, '').trim();
                    if (content) return content;
                    // If content is not in the same element, check next siblings
                    let sibling = labelElement.nextElementSibling;
                    while (sibling) {
                        if (sibling.textContent.trim()) {
                            return sibling.textContent.trim();
                        }
                        sibling = sibling.nextElementSibling;
                    }
                }
                return defaultValue;
            }

            // New function specifically for extracting content between labels
            function extractBetweenLabels(startLabel, stopLabel, defaultValue = '') {
                const text = detailsDiv.textContent.replace(/\s+/g, ' '); // Normalize all whitespace
                const startLabelPattern = new RegExp(startLabel.replace(':', '\\s*:'), 'i'); // Make colon and spacing flexible
                
                const match = text.match(startLabelPattern);
                if (!match) return defaultValue;
                
                const startIndex = match.index;
                if (startIndex === -1) return defaultValue;
                
                const contentStart = startIndex + match[0].length;
                const stopIndex = text.indexOf(stopLabel, contentStart);
                
                if (stopIndex === -1) {
                    return text.substring(contentStart).trim() || defaultValue;
                }
                
                return text.substring(contentStart, stopIndex).trim() || defaultValue;
            }

            fields.merchant = extractBetweenLabels('Merchant:', 'Offer', 'No merchant');
            
            // Updated offer extraction
            fields.offer = (() => {
                const allText = detailsDiv.textContent;
                
                // Different possible section markers
                const startMarkers = [
                    'Offers:',
                    'Offers',
                    'Offer:',
                    'Offer'
                ];
                const endMarkers = [
                    'Period:',
                    'Periods:'
                ];

                // Find the start and end positions
                let startPos = -1;
                let startMarkerUsed = '';
                for (const marker of startMarkers) {
                    const pos = allText.indexOf(marker);
                    if (pos !== -1 && (startPos === -1 || pos < startPos)) {
                        startPos = pos;
                        startMarkerUsed = marker;
                    }
                }

                if (startPos === -1) return 'No offer';

                let endPos = -1;
                for (const marker of endMarkers) {
                    const pos = allText.indexOf(marker, startPos + startMarkerUsed.length);
                    if (pos !== -1 && (endPos === -1 || pos < endPos)) {
                        endPos = pos;
                    }
                }

                // Extract the offer section
                const offerText = endPos !== -1 
                    ? allText.substring(startPos + startMarkerUsed.length, endPos)
                    : allText.substring(startPos + startMarkerUsed.length);

                return offerText.replace(/\n+/g, '\n').trim() || 'No offer';
            })();
            
            // Other fields continue using the original extractField function
            fields.period = (() => {
                const allText = detailsDiv.textContent;
                
                const startMarkers = [
                    'Period:',
                    'Periods:'
                ];
                const endMarkers = [
                    'Eligibility:',
                    'Location:',
                    'Locations:',
                    'Contact:',
                    'Contacts:',
                    'Reservation:',
                    'Reservations:',
                    'Contact No:',
                    'Telephone:',
                    'Tel:',
                    'Special Terms'
                ];

                let startPos = -1;
                let startMarkerUsed = '';
                for (const marker of startMarkers) {
                    const pos = allText.indexOf(marker);
                    if (pos !== -1 && (startPos === -1 || pos < startPos)) {
                        startPos = pos;
                        startMarkerUsed = marker;
                    }
                }

                if (startPos === -1) return 'No period';

                let endPos = -1;
                for (const marker of endMarkers) {
                    const pos = allText.indexOf(marker, startPos + startMarkerUsed.length);
                    if (pos !== -1 && (endPos === -1 || pos < endPos)) {
                        endPos = pos;
                    }
                }

                const periodSection = endPos !== -1 
                    ? allText.substring(startPos + startMarkerUsed.length, endPos)
                    : allText.substring(startPos + startMarkerUsed.length);

                return periodSection.trim() || 'No period';
            })();
            fields.eligibility = extractField(/^Eligibility[:\s]/i, 'No eligibility');
            fields.contacts = (() => {
                // Find all text content that might contain contacts
                const allText = detailsDiv.textContent;
                
                // Different possible section markers
                const startMarkers = [
                    'Contact:',
                    'Contacts:',
                    'Reservation:',
                    'Reservations:',
                    'Telephone:',
                    'Tel:',
                    'Contact No:'
                ];
                const endMarkers = [
                    'Website:',
                    'Eligibility:',
                    'Location:',
                    'Locations:',
                    'Special Terms',
                    'Special Terms & Conditions',
                    'Special'
                ];

                // Find the start and end positions
                let startPos = -1;
                let startMarkerUsed = '';
                for (const marker of startMarkers) {
                    const pos = allText.indexOf(marker);
                    if (pos !== -1 && (startPos === -1 || pos < startPos)) {
                        startPos = pos;
                        startMarkerUsed = marker;
                    }
                }

                if (startPos === -1) return '';

                let endPos = -1;
                for (const marker of endMarkers) {
                    const pos = allText.indexOf(marker, startPos + startMarkerUsed.length);
                    if (pos !== -1 && (endPos === -1 || pos < endPos)) {
                        endPos = pos;
                    }
                }

                // Extract the contacts section
                const contactsSection = endPos !== -1 
                    ? allText.substring(startPos + startMarkerUsed.length, endPos)
                    : allText.substring(startPos + startMarkerUsed.length);

                return contactsSection.replace(/\n+/g, '\n').trim() || '';
            })();

            // Replace the extractTextAfterLabel call with this new implementation
            fields.locations = (() => {
                const allText = detailsDiv.textContent;
                
                const startMarkers = [
                    'Location:',
                    'Locations:',
                ];
                const endMarkers = [
                    'Contact:',
                    'Contacts:',
                    'Special Terms',
                    'General Terms',
                    'Eligibility:',
                    'Offer:',
                    'Period:',
                    'Contact No:',
                    'Contact No: ',
                    'Reservations:',
                    'HNB INSTALLMENT'
                ];

                let startPos = -1;
                let startMarkerUsed = '';
                for (const marker of startMarkers) {
                    const pos = allText.indexOf(marker);
                    if (pos !== -1 && (startPos === -1 || pos < startPos)) {
                        startPos = pos;
                        startMarkerUsed = marker;
                    }
                }

                if (startPos === -1) return '';

                let endPos = -1;
                for (const marker of endMarkers) {
                    const pos = allText.indexOf(marker, startPos + startMarkerUsed.length);
                    if (pos !== -1 && (endPos === -1 || pos < endPos)) {
                        endPos = pos;
                    }
                }

                const locationsSection = endPos !== -1 
                    ? allText.substring(startPos + startMarkerUsed.length, endPos)
                    : allText.substring(startPos + startMarkerUsed.length);

                // Replace multiple newlines with a single newline
                return locationsSection.replace(/\n+/g, '\n').trim() || '';
            })();

            // Updated terms extraction
            fields.terms = (() => {
                // Find all text content that might contain special terms
                const allText = detailsDiv.textContent;
                
                // Different possible section markers
                const startMarkers = [
                    'Special Terms & Conditions:',
                    'Special Terms and Conditions:',
                    'Special Terms & Conditions',
                    'Special Terms and Conditions',
                    'Special Terms',
                    'Special'
                ];
                const endMarkers = [
                    'General Terms & Conditions',
                    'General Terms and Conditions',
                    'General Terms',
                    'HNB INSTALLMENT PROMOTION TERMS AND CONDITIONS'
                ];

                // Find the start and end positions
                let startPos = -1;
                let startMarkerUsed = '';
                for (const marker of startMarkers) {
                    const pos = allText.indexOf(marker);
                    if (pos !== -1 && (startPos === -1 || pos < startPos)) {
                        startPos = pos;
                        startMarkerUsed = marker;
                    }
                }

                if (startPos === -1) return 'No terms';

                let endPos = -1;
                for (const marker of endMarkers) {
                    const pos = allText.indexOf(marker, startPos + startMarkerUsed.length);
                    if (pos !== -1 && (endPos === -1 || pos < endPos)) {
                        endPos = pos;
                    }
                }

                // Extract the terms section
                const termsSection = endPos !== -1 
                    ? allText.substring(startPos + startMarkerUsed.length, endPos)
                    : allText.substring(startPos + startMarkerUsed.length);

                // Find all list items within the terms section
                const terms = [];
                const listItemRegex = /(?:^|\n)\s*[-•]?\s*([^:\n]+?)(?=\n|$)/g;
                let match;

                while ((match = listItemRegex.exec(termsSection)) !== null) {
                    const term = match[1].trim();
                    if (term && !term.includes('General Terms') && term.length > 5) {
                        terms.push(term);
                    }
                }

                return terms.length > 0 ? terms.join('\n') : 'No terms';
            })();

            return fields;
        });

        const image = await page.evaluate(() => {
            const imageElement = document.querySelector('.hnbcp-offer-logo-holder img');
            return imageElement ? imageElement.getAttribute('src') : null;
        });

        details.image = image ? `${baseURL}${image}` : 'No image';
        return details;
    } catch (error) {
        console.error(`Error fetching details from ${url}: ${error.message}`);
        return {
            title: 'No title',
            merchant: 'No merchant',
            image: 'No image',
            offer: 'No offer',
            period: 'No period',
            locations: '',
            eligibility: 'No eligibility',
            contacts: '',
            terms: 'No terms',
        };
    } finally {
        await page.close();
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

// Execute the scraper and save results to a CSV file
scrapeHNBPromotions().then(results => {
    const outputDir = path.join(__dirname, 'scraped_results');
    const filePath = path.join(outputDir, 'HNB_data.csv');

    // Create the directory if it doesn't exist
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }

    const csvWriter = createCsvWriter({
        path: filePath,
        header: [
            { id: 'bank_id', title: 'bank_id' },
            { id: 'category_id', title: 'category_id' },
            { id: 'offer_title', title: 'offer_title' },
            { id: 'merchant_details', title: 'merchant_details' },
            { id: 'merchant_contact', title: 'merchant_contact' },
            { id: 'merchant_locations', title: 'merchant_locations' },
            { id: 'offer_details_1', title: 'offer_details_1' },
            { id: 'offer_details_2', title: 'offer_details_2' },
            { id: 'offer_validity', title: 'offer_validity' },
            { id: 'discount', title: 'discount' },
            { id: 'image_url', title: 'image_url' },
            { id: 'more_details_url', title: 'more_details_url' },
        ]
    });

    // Prepare data
    const records = [];

    for (const categoryName in results) {
        const categoryResults = results[categoryName];
        const categoryId = categoryName === 'dining' ? 1 : categoryName === 'hotels' ? 2 : categoryName === 'shopping' ? 3 : 0;

        categoryResults.forEach(item => {
            const record = {
                bank_id: 3,
                category_id: categoryId,
                offer_title: item.title || '',
                merchant_details: item.merchant || '',
                merchant_contact: item.contacts || '',
                merchant_locations: item.locations || '',
                offer_details_1: item.terms || '',
                offer_details_2: item.eligibility || '',
                offer_validity: item.period || '',
                discount: item.offer || '',
                image_url: item.image || '',
                more_details_url: item.detailsURL || ''
            };
            records.push(record);
        });
    }

    csvWriter.writeRecords(records)
        .then(() => {
            console.log(`Results saved to ${filePath}`);
        })
        .catch(err => {
            console.error(`Error writing CSV file: ${err}`);
        });
});
