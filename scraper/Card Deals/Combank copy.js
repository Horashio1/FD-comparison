const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapeCombankPromotions() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the ComBank rewards promotions page
    await page.goto('https://www.combank.lk/rewards-promotions', {
        waitUntil: 'networkidle2',
        timeout: 60000, // e.g., 60 seconds
      });

    // Wait for the promotions to load
    await page.waitForSelector('.offers-area');

    // Prepare CSV writer
    const outputDir = path.resolve(__dirname, 'scraped_results');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const csvFilePath = path.join(outputDir, 'Combank_data.csv');
    const csvWriterInstance = csvWriter({
        path: csvFilePath,
        header: [
            { id: 'bank_id', title: 'bank_id' },
            { id: 'category_id', title: 'category_id' },
            { id: 'offer_title', title: 'offer_title' },
            { id: 'merchant_details', title: 'merchant_details' },
            { id: 'offer_details_1', title: 'offer_details_1' },
            { id: 'offer_details_2', title: 'offer_details_2' },
            { id: 'discount', title: 'discount' },
            { id: 'image_url', title: 'image_url' },
            { id: 'more_details_url', title: 'more_details_url' }
        ]
    });

    const categoriesToScrape = ['#food-restaurants', '#supermarket', '#leisure','#seasonal-offers'];
    const results = [];

    for (const category of categoriesToScrape) {
        const categoryData = await page.evaluate((category) => {
            const categoryElement = document.querySelector(category);
            if (!categoryElement) return null;

            const categoryName = categoryElement.querySelector('.sub-title')?.innerText || 'Unknown Category';
            const offers = Array.from(categoryElement.querySelectorAll('.reward.box-shadow.active')).map(offer => {
                const link = offer.getAttribute('href') || '';
                const imageUrl = offer.querySelector('.reward-image')?.style.backgroundImage?.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || '';
                const percentageTag = Array.from(offer.querySelector('.offer-tag.percentage')?.querySelectorAll('p') || [])
                    .map(p => p.textContent?.trim())
                    .filter(Boolean)
                    .join(' ') || '';
                const title = offer.querySelector('.reward-content h3')?.innerText || '';
                return { link, imageUrl, percentageTag, title };
            });

            return { categoryName, offers };
        }, category);

        if (categoryData) {
            const categoryId = category === '#food-restaurants' ? 1 :
                               category === '#supermarket' ? 3 : 
                               category === '#leisure' ? 2 :
                               category === '#seasonal-offers' ? 4 : 4;

            for (const offer of categoryData.offers) {
                let merchantDetails = '';
                const title = offer.title;
                
                // New logic to handle different title formats
                if (title.includes('at ')) {
                    const atIndex = title.indexOf('at ') + 3;
                    let endIndex = title.length;
                    
                    // If there's a "with" after "at", use it as the end point
                    const withAfterAt = title.indexOf('with ', atIndex);
                    if (withAfterAt !== -1) {
                        endIndex = withAfterAt;
                    }
                    
                    merchantDetails = title.substring(atIndex, endIndex).trim();
                    
                    // Capitalize the first character of merchant_details
                    if (merchantDetails.length > 0) {
                        merchantDetails = merchantDetails.charAt(0).toUpperCase() + merchantDetails.slice(1);
                    }
                }

                let moreInfo = '';
                let moreInfoImageUrl = '';

                if (offer.link) {
                    const detailsPage = await browser.newPage();
                    await detailsPage.goto(offer.link, { waitUntil: 'networkidle2' });

                    const details = await detailsPage.evaluate(() => {
                        const editorContent = document.querySelector('.editor-content');
                        const firstOl = editorContent?.querySelector('ol');
                        const additionalInfo = firstOl ? firstOl.innerText : '';

                        const rewardImageElement = document.querySelector('.news-content-container figure.reward-image img');
                        const rewardImageUrl = rewardImageElement ? rewardImageElement.getAttribute('src') : '';

                        return { moreInfo: additionalInfo, moreInfoImageUrl: rewardImageUrl };
                    });

                    moreInfo = details.moreInfo;
                    moreInfoImageUrl = details.moreInfoImageUrl;
                    await detailsPage.close();
                }

                results.push({
                    bank_id: 1,
                    category_id: categoryId,
                    offer_title: offer.title,
                    merchant_details: merchantDetails,
                    offer_details_1: moreInfo,
                    offer_details_2: moreInfoImageUrl,
                    discount: offer.percentageTag.toString(), // Ensure discount is stored as a string
                    image_url: offer.imageUrl,
                    more_details_url: offer.link
                });
            }
        }
    }

    await csvWriterInstance.writeRecords(results);
    console.log(`Data successfully written to ${csvFilePath}`);

    await browser.close();
}

scrapeCombankPromotions();
