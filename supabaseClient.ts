// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const supabaseUrl = 'https://kbcaevsuxnajykrzhjco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2FldnN1eG5hanlrcnpoamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyMDE2MDYsImV4cCI6MjA0Mjc3NzYwNn0.X3Zi7DmT_Y8Xbltx-tPzhrfhz3AhIs3lb59RrpLMBfY';

export const supabase = createClient(supabaseUrl, supabaseKey);
