import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) {
    console.error("Error fetching employees:", error);
  } else {
    console.log("Employees in database:");
    console.log(data);
  }
}

check();
