const puppeteer = require('puppeteer');

async function scrapeDailyMirrorHeadlines() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the Daily Mirror top stories page
  await page.goto('https://www.dailymirror.lk/top-storys/155', { waitUntil: 'networkidle2' });

  // Wait for the article containers to load
  await page.waitForSelector('.lineg');

  // Extract the first 5 headline details along with their links
  const headlines = await page.evaluate(() => {
    const data = [];
    const articleElements = document.querySelectorAll('.lineg');

    // Extract up to 5 articles
    articleElements.forEach((article, index) => {
      if (index < 5) {
        const title = article.querySelector('.cat_title')?.innerText || '';
        const createdAt = article.querySelector('.text-secondary')?.innerText || '';
        const description = article.querySelector('.text-dark')?.innerText || '';

        // Correct link extraction
        const linkElement = article.querySelector('a[href^="https://www.dailymirror.lk/top-story"]');  // Ensures the link starts with the right prefix
        const link = linkElement ? linkElement.href : '';  // Get the href from the valid <a> tag

        if (title && createdAt && description && link) {
          data.push({
            title,
            createdAt,
            description,
            link  // Add the correct link
          });
        }
      }
    });

    return data;
  });

  // Output the scraped headlines
  console.log('Daily Mirror Headlines:', headlines);

  await browser.close();
}

scrapeDailyMirrorHeadlines();
