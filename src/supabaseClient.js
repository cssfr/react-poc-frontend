import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // turn off the silent token refresh
    autoRefreshToken: false,
    // don’t re-use an old session on page reload
    persistSession: false,
  },
})
