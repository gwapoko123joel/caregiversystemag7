
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking user_profiles table structure...');
  
  // Try to insert a dummy record (it might fail but will give error message)
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
      role: 'caregiver',
      access_id: 'TEST-9999'
    })
    .select();

  if (error) {
    console.log('--- ERROR DURING TEST INSERT ---');
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
  } else {
    console.log('Test insert succeeded! Delete it now.');
    await supabase.from('user_profiles').delete().eq('user_id', '00000000-0000-0000-0000-000000000000');
  }

  // Check columns
  console.log('Attempting to fetch one record to see columns...');
  const { data: sample, error: sampleError } = await supabase.from('user_profiles').select('*').limit(1);
  if (sampleError) {
      console.log('Sample fetch error:', sampleError.message);
  } else if (sample && sample.length > 0) {
      console.log('Table columns:', Object.keys(sample[0]));
  } else {
      console.log('Table is empty. Cannot determine columns via select.');
  }
}

check();
