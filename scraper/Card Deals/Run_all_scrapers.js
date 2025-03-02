require('dotenv').config({ path: '../../.env' });
const { exec } = require('child_process');

// Toggle whether you want to run update_table.js after scraping
const runUpdateTableAfterScrapers = true;

// List of bank scrapers to run in sequence.
// Comment any line out to skip that particular scraper.
const scrapersToRun = [
// { bankName: 'Amex', script: 'Amex.js' },
// { bankName: 'BOC', script: 'BOC.js' },
  // { bankName: 'ComBank', script: 'Combank.js' },
  // { bankName: 'DFCC', script: 'DFCC.js' },
  { bankName: 'HNB', script: 'HNB.js' },
  { bankName: 'HSBC', script: 'HSBC.js' },
  { bankName: 'NDB', script: 'NDB.js' },
  { bankName: 'PeoplesBank', script: 'PeoplesBank.js' },
  { bankName: 'Sampath', script: 'Sampath.js' },
  { bankName: 'Seylan', script: 'Seylan.js' },
  { bankName: 'UnionBank', script: 'UnionBank.js' },

//   { bankName: 'NTB', script: 'NTB.js' },
];

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptPath}:`, error);
        return reject(error);
      }
      if (stdout) console.log(stdout.trim());
      if (stderr) console.error(stderr.trim());
      resolve();
    });
  });
}

async function main() {
  try {
    // 1) Run each scraper in sequence
    for (const { bankName, script } of scrapersToRun) {
      console.log(`\n=== Running scraper for ${bankName} (${script}) ===`);
      await runScript(script);
      console.log(`=== Finished scraping ${bankName} ===\n`);
    }

    // 2) Conditionally run update_table.js
    if (runUpdateTableAfterScrapers) {
      console.log(`\n=== All scrapers done. Now updating Supabase table... ===`);
      await runScript('update_table.js');
      console.log(`=== Finished updating Supabase table ===\n`);
    } else {
      console.log('\nSkipping update_table.js step.\n');
    }

  } catch (err) {
    console.error('Error in run_all_scrapers:', err);
    process.exit(1);
  }
}

// Start everything
main();
