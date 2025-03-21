require('dotenv').config({ path: '../../.env' });

const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { supabase } = require('../../supabaseClient');


const currentTimestamp = new Date();
currentTimestamp.setTime(currentTimestamp.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours
const updatedTimestamp = currentTimestamp.toISOString();

const banksToUpdate = [
  { bank_id: 1, bank_name: 'Combank', fileName: 'Combank_data.csv' },
  { bank_id: 2, bank_name: 'Sampath Bank', fileName: 'Sampath_data.csv' },
  { bank_id: 3, bank_name: 'HNB', fileName: 'HNB_data.csv' },
  { bank_id: 4, bank_name: 'NDB Bank', fileName: 'NDB_data.csv' },
  { bank_id: 5, bank_name: 'BOC', fileName: 'BOC_data.csv' },
  { bank_id: 6, bank_name: 'Seylan Bank', fileName: 'Seylan_data.csv' },
  { bank_id: 7, bank_name: 'DFCC', fileName: 'DFCC_data.csv' },
  { bank_id: 8, bank_name: 'HSBC', fileName: 'HSBC_data.csv' },
  { bank_id: 10, bank_name: 'Amex', fileName: 'Amex_data.csv' },
  { bank_id: 11, bank_name: 'Peoples Bank', fileName: 'PeoplesBank_data.csv' },
  { bank_id: 12, bank_name: 'Union Bank', fileName: 'UnionBank_data.csv' },

    // { bank_id: 9, bank_name: 'Nations Trust Bank', fileName: 'NTB_data.csv' },

];

async function updateBankOffers() {
  for (const bank of banksToUpdate) {
    const bankIdFromConfig = parseInt(bank.bank_id, 10);
    const { fileName, bank_name } = bank;
    const filePath = path.join('./scraped_results/', fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`[${bank_name}] File not found: ${filePath}`);
      continue;
    }

    try {
      // 1) Delete existing records for this bank, returning deleted rows so we can count them
      const { data: deletedData, error: deleteError } = await supabase
        .from('card_offers')
        .delete()
        .eq('bank_id', bankIdFromConfig)
        .select('*'); // returns the deleted rows

      if (deleteError) {
        console.error(`[${bank_name}] Error deleting records:`, deleteError.message);
        continue;
      } else {
        const numDeleted = deletedData ? deletedData.length : 0;
        console.log(`[${bank_name}] Deleted ${numDeleted} record(s) for bank ID: ${bankIdFromConfig}`);
      }

      // Prepare array to hold all parsed records
      const records = [];

      // 2) Parse CSV rows
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(
            csvParser({
              // Strip BOM from any header, especially bank_id
              mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim(),
            })
          )
          .on('data', (row) => {
            // parse IDs as integers
            const csvBankId = parseInt(row.bank_id, 10);
            const csvCategoryId = parseInt(row.category_id, 10);

            if (isNaN(csvBankId) || isNaN(csvCategoryId)) {
              console.error(`[${bank_name}] Invalid bank_id or category_id in row:`, row);
              return;
            }

            records.push({
              ...row,
              bank_id: csvBankId,
              category_id: csvCategoryId,
              updated_at: updatedTimestamp,
            });
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // 3) Insert new records (returns inserted rows so we can count them)
      const { data: insertedData, error: insertError } = await supabase
        .from('card_offers')
        .insert(records)
        .select('*'); // returns inserted rows

      if (insertError) {
        console.error(`[${bank_name}] Error inserting records:`, insertError.message);
      } else {
        const numInserted = insertedData ? insertedData.length : 0;
        console.log(`[${bank_name}] Inserted ${numInserted} record(s) for bank ID: ${bankIdFromConfig}`);
      }
    } catch (error) {
      console.error(`[${bank_name}] Error for bank ID ${bankIdFromConfig}:`, error);
    }
  }

  console.log('Update process completed.');
}

updateBankOffers();
