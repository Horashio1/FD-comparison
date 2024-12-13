const puppeteer = require('puppeteer');

async function scrapeFixedDepositRates() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Replace this URL with the actual bank URL
  await page.goto('https://www.combank.lk/personal-banking/term-deposits/fixed-deposits');

  // Wait for the table containing interest rates to load
  await page.waitForSelector('.with-radius.left-align.default-font');

  // Extract interest rates for 6, 12, and 24 months
  const rates = await page.evaluate(() => {
    // Select all rows in the table
    const rows = document.querySelectorAll('.with-radius.left-align.default-font tbody tr');

    // Prepare an object to store the interest rates for 6, 12, and 24 months
    const rateData = {
      '6 months': null,
      '12 months': null,
      '24 months': null,
    };

    // Loop through rows and extract data based on exact term
    rows.forEach((row) => {
      const termText = row.querySelector('td').innerText.trim();
      const interestRate = row.querySelectorAll('td')[1].innerText.trim();
      const annualEffectiveRate = row.querySelectorAll('td')[2].innerText.trim();

      // Match exact terms
      if (termText === '6 Month (LKR)') {
        rateData['6 months'] = {
          interestRate,
          annualEffectiveRate
        };
      }
      if (termText === '12 Months -Interest at maturity (LKR)') {
        rateData['12 months'] = {
          interestRate,
          annualEffectiveRate
        };
      }
      if (termText === '24 Months -Interest paid annually (LKR)') {
        rateData['24 months'] = {
          interestRate,
          annualEffectiveRate
        };
      }
    });

    return rateData;
  });

  // Output the results
  console.log('Fixed Deposit Rates:', rates);

  await browser.close();
}

scrapeFixedDepositRates();
