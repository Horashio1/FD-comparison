const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials (make sure to keep them safe)
const SUPABASE_URL = 'https://kbcaevsuxnajykrzhjco.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2FldnN1eG5hanlrcnpoamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyMDE2MDYsImV4cCI6MjA0Mjc3NzYwNn0.X3Zi7DmT_Y8Xbltx-tPzhrfhz3AhIs3lb59RrpLMBfY';

// Initialize the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to get current date in 'YYYY-MM-DD' format
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function scrapeDailyMirrorHeadlines() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the Daily Mirror top stories page
  await page.goto('https://www.dailymirror.lk/top-storys/155', { waitUntil: 'networkidle2' });

  // Wait for the article containers to load
  await page.waitForSelector('.lineg');

  // Extract the current date
  const currentDate = getCurrentDate();

  // Extract the first 5 headline details along with their links
  const headlines = await page.evaluate(() => {
    const data = [];
    const articleElements = document.querySelectorAll('.lineg');

    // Extract up to 5 articles
    articleElements.forEach((article, index) => {
      if (index <= 5) {
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

  // Add the current date to each scraped headline
  const headlinesWithDate = headlines.map(headline => ({
    ...headline,
    date_time: currentDate  // Add the current date
  }));

  console.log('Scraped Headlines with Date:', headlinesWithDate);

  // Insert the scraped data with the date into Supabase table
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