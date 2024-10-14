// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
