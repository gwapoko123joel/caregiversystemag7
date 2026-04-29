import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf-8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=')
    if (key && val) acc[key.trim()] = val.join('=').trim()
    return acc
  }, {})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugLogin() {
  const email = 'jvgajilomo.student@asiancollege.edu.ph'
  const password = '772004gajilomo'
  
  console.log(`Testing login for ${email}...`)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) {
    console.error('Login failed:', error.message)
  } else {
    console.log('Login successful!', data.user.id)
  }
}

debugLogin()
