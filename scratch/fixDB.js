import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDB() {
  console.log("Connecting to Supabase...");
  
  const adminUser = {
    id: 'EMP-000',
    name: 'Super Admin',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'Admin',
    department: 'Management',
    status: 'Active',
    attendance: 100,
    avatar_color: 'from-blue-500 to-indigo-500',
    initials: 'SA'
  };

  const { data, error } = await supabase
    .from('employees')
    .upsert(adminUser)
    .select();

  if (error) {
    console.error("Failed to fix DB:", error.message);
  } else {
    console.log("Successfully forcefully set Admin credentials in Database!");
    console.log(data);
  }
}

fixDB();
