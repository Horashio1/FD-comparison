require('dotenv').config({ path: '../.env' });  // Load environment variables first
const puppeteer = require('puppeteer');
const { supabase } = require('../supabaseClient');  // Importing Supabase client

async function scrapeDailyMirrorHeadlines() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Helper function to scrape headlines from a given URL
  async function scrapeFromUrl(url, headlineLimit = 5) {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the article containers to load
    await page.waitForSelector('.lineg');

    // Extract the first `headlineLimit` headline details along with their links
    const headlines = await page.evaluate((limit) => {
      const data = [];
      const articleElements = document.querySelectorAll('.lineg');

      articleElements.forEach((article, index) => {
        if (index < limit) {
          const title = article.querySelector('.cat_title')?.innerText || '';
          const createdAt = article.querySelector('.text-secondary')?.innerText || '';
          const description = article.querySelector('.text-dark')?.innerText || '';

          // Correct link extraction
          const linkElement = article.querySelector('a[href^="https://www.dailymirror.lk"]');
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
    }, headlineLimit);

    return headlines;
  }

  // Scrape from `/top-story` first
  let headlines = await scrapeFromUrl('https://www.dailymirror.lk/top-storys/155', 5);

  // If less than 5 headlines were scraped from `/top-story`, scrape additional from `/breaking-news`
  const remainingHeadlinesCount = 5 - headlines.length;
  if (remainingHeadlinesCount > 0) {
    const breakingNewsHeadlines = await scrapeFromUrl('https://www.dailymirror.lk/breaking-news/108', remainingHeadlinesCount);
    headlines = headlines.concat(breakingNewsHeadlines);  // Combine the two lists
  }

  // Extract the current date and time
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0].slice(0, 5);  // Extract HH:MM format

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
