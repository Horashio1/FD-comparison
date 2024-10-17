require('dotenv').config({ path: '../.env' });  // Load environment variables first
const puppeteer = require('puppeteer');
const { supabase } = require('../supabaseClient');  // Importing Supabase client

async function scrapeDailyMirrorHeadlines() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the Daily Mirror top stories page
  await page.goto('https://www.dailymirror.lk/top-storys/155', { waitUntil: 'networkidle2' });

  // Wait for the article containers to load
  await page.waitForSelector('.lineg');

  // Extract the current date and time
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0].slice(0, 5);  // Extract HH:MM format

  // Extract the first 5 headline details along with their links
  const headlines = await page.evaluate(() => {
    const data = [];
    const articleElements = document.querySelectorAll('.lineg');

    // Extract up to 5 articles
    articleElements.forEach((article, index) => {
      if (index < 6) {
        const title = article.querySelector('.cat_title')?.innerText || '';
        const createdAt = article.querySelector('.text-secondary')?.innerText || '';
        const description = article.querySelector('.text-dark')?.innerText || '';

        // Correct link extraction
        const linkElement = article.querySelector('a[href^="https://www.dailymirror.lk/top-story"]');
        const link = linkElement ? linkElement.href : '';

        if (title && createdAt && description && link) {
          data.push({
            title,
            createdAt,
            description,
            link,
          });
        }
      }
    });

    return data;
  });

  // Add the current date and time to each scraped headline
  const headlinesWithDate = headlines.map(headline => ({
    ...headline,
    date_time: currentDate,  // Add the current date
    updatedAt: currentTime   // Add the current time in HH:MM format
  }));

  console.log('Scraped Headlines with Date and Time:', headlinesWithDate);

  // Insert the scraped data with the date and time into Supabase table
  const { data, error } = await supabase
    .from('daily_mirror_scrape')  // Use your Supabase table name here
    .insert(headlinesWithDate);

  if (error) {
    console.error('Error inserting data into Supabase:', error.message);
  } else {
    console.log('Data successfully inserted into Supabase:', data);
  }

  await browser.close();
}

// Execute the async function
scrapeDailyMirrorHeadlines();
