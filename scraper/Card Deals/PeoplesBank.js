require('dotenv').config({ path: '../../.env' });

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const axios = require('axios');  // For downloading images
const { supabase } = require('../../supabaseClient'); // Adjust path if needed

const BUCKET_NAME = 'card_promo_images';
const FOLDER_NAME = 'PeoplesBank';

async function clearBucketFolder() {
  // List all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(FOLDER_NAME, { limit: 1000, search: '' });

  if (listError) {
    console.error('Error listing bucket folder files:', listError);
    return;
  }

  if (!files || files.length === 0) {
    console.log('No files to remove in the folder. Skipping cleanup.');
    return;
  }

  // Create an array of file paths (with the folder name prefixed)
  const filePaths = files.map(file => `${FOLDER_NAME}/${file.name}`);

  // Remove all files
  const { error: removeError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (removeError) {
    console.error('Error removing files from bucket folder:', removeError);
  } else {
    console.log('Successfully cleared the bucket folder before upload.');
  }
}

async function downloadAndUploadImage(imageUrl, index) {
  try {
    // Download the image to a buffer
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    // Figure out extension (fallback to .jpg if none)
    let extension = path.extname(imageUrl).split('?')[0];
    if (!extension) extension = '.jpg';

    // Create a unique file name
    const fileName = `${Date.now()}_${index}${extension}`;
    const filePath = `${FOLDER_NAME}/${fileName}`;

    // Upload the buffer to Supabase
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, response.data, {
        contentType: 'image/jpeg', // Adjust if images are PNG, etc.
      });

    if (uploadError) {
      console.error(`Error uploading image to Supabase: ${uploadError.message}`);
      return '';
    }

    // Retrieve the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Return the new public URL for usage
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Error downloading/uploading image: ${error.message}`);
    return '';
  }
}

async function scrapeCategory(category, url, categoryId) {
  console.log(`Scraping category: ${category} from URL: ${url}`);
  const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
  const page = await browser.newPage();

  // Set viewport and user-agent
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.3945.88 Safari/537.36'
  );

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log(`Page loaded successfully for category: ${category} from URL: ${url}`);

    const promotions = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.col-md-4'));
      return cards
        .map(card => {
          const imageUrl = card
            .querySelector('.front')
            ?.style?.backgroundImage?.match(/url\((['"]?)(.*?)\1\)/)?.[2] || '';
          const merchantDetails = card.querySelector('h6.flip-back-header2')?.innerText || '';
          if (merchantDetails === 'Terms & Conditions') return null;
          const discount = card.querySelector('h6[style*="sansation-bold"]')?.innerText || '';
          const validity = card.querySelector('h2.flip-back-header3')?.innerText || '';

          // Collect all lines of offer details
          const offerDetailsElements = card.querySelectorAll('h6.text-type1.mt2');
          const offerDetails = Array.from(offerDetailsElements)
            .map(el => el.innerText.trim().replace(/\n/g, ' '))
            .filter(text => text !== '');

          // Extract the first offer detail
          const offerDetails1 = offerDetails.length > 0 ? offerDetails[0] : '';

          return {
            imageUrl,
            merchantDetails,
            discount,
            validity,
            offerDetails1,
          };
        })
        .filter(promo => promo !== null);
    });

    console.log(`Scraped ${promotions.length} promotions for category: ${category} from URL: ${url}`);
    return { categoryId, promotions, categoryUrl: url };
  } catch (error) {
    console.error(`Error scraping category: ${category} from URL: ${url} - ${error.message}`);
    return { categoryId, promotions: [], categoryUrl: url };
  } finally {
    await browser.close();
  }
}

async function scrapePeoplesBankPromos() {
  // 1. Clear bucket folder before each run
  await clearBucketFolder();

  // Categories to scrape
  const categories = [
    { name: 'Dining', url: 'https://www.peoplesbank.lk/restaurants-credit-card/', id: 1 },
    { name: 'Hotel', url: 'https://www.peoplesbank.lk/leisure-credit-card/', id: 2 },
    { name: 'Groceries', url: 'https://www.peoplesbank.lk/super-markets-credit-card/', id: 3 },
    { name: 'Shopping', url: 'https://www.peoplesbank.lk/clothing-credit-card/', id: 4 },
    { name: 'Shopping', url: 'https://www.peoplesbank.lk/electronics-credit-card/', id: 4 },
    { name: 'Shopping', url: 'https://www.peoplesbank.lk/shoes-leather-credit-card/', id: 4 },
    { name: 'Shopping', url: 'https://www.peoplesbank.lk/credit-card-others/', id: 4 },
];

  const csvFilePath = path.join(__dirname, 'scraped_results', 'PeoplesBank_data.csv');
  const csvDir = path.dirname(csvFilePath);

  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }

  const csvWriterInstance = csvWriter({
    path: csvFilePath,
    header: [
      { id: 'bank_id',          title: 'bank_id' },
      { id: 'category_id',      title: 'category_id' },
      { id: 'merchant_details', title: 'merchant_details' },
      { id: 'discount',         title: 'discount' },
      { id: 'offer_validity',   title: 'offer_validity' },
      { id: 'offer_details_1',  title: 'offer_details_1' },
      { id: 'image_url',        title: 'image_url' },
      { id: 'more_details_url', title: 'more_details_url' },
    ],
  });

  const allData = [];
  const BANK_ID = 11;

  let promoIndex = 0; // Used to generate filenames uniquely

  for (const category of categories) {
    const result = await scrapeCategory(category.name, category.url, category.id);

    for (const promo of result.promotions) {
      // Upload image to Supabase and get the public URL
      const newImageUrl = await downloadAndUploadImage(promo.imageUrl, promoIndex);
      promoIndex++;

      allData.push({
        bank_id: BANK_ID,
        category_id: result.categoryId,
        merchant_details: promo.merchantDetails,
        discount: promo.discount,
        offer_validity: promo.validity,
        offer_details_1: promo.offerDetails1,
        image_url: newImageUrl || promo.imageUrl,  // Fallback to original if upload fails
        more_details_url: result.categoryUrl,
      });
    }
  }

  await csvWriterInstance.writeRecords(allData);
  console.log('CSV file has been written successfully with updated image URLs.');
}

// Run the main scraper
scrapePeoplesBankPromos();
