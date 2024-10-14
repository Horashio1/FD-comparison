const puppeteer = require('puppeteer');
// import puppeteer from 'puppeteer';

async function scrapeHackerNews() {
  // Launch a new browser instance
  const browser = await puppeteer.launch();
  // Open a new page
  const page = await browser.newPage();
  // Navigate to the site
  await page.goto('https://news.ycombinator.com/');

  // Scrape titles of articles
  const titles = await page.evaluate(() => {
    // Select all elements containing the titles
    const elements = document.querySelectorAll('.titleline > a');
    // Map over elements and extract the inner text
    return Array.from(elements).map(element => element.innerText);
  });

  // Output the results
  console.log('Hacker News Titles:', titles);

  // Close the browser
  await browser.close();
}

// Run the scrape function
scrapeHackerNews();
