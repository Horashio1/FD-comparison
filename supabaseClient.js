require('dotenv').config();  // Load environment variables from .env first
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// Check if the environment variables are loaded
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key from environment variables');
  process.exit(1);  // Exit if credentials are missing
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
