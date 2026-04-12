import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Manual .env parsing
const env = fs.readFileSync('.env', 'utf-8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=')
    if (key && val) acc[key.trim()] = val.join('=').trim()
    return acc
  }, {})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log(`Testing connection to: ${supabaseUrl}`)

  try {
    // Attempt to fetch a single row from the profiles table as requested
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Connection Test Failed. Error details:')
      console.error(JSON.stringify(error, null, 2))
    } else {
      console.log('Connection Test Successful!')
      console.log('Fetched data:', data)
    }
  } catch (err) {
    console.error('Catastrophic failure during fetch:', err.message)
  }
}

testConnection()
