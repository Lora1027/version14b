
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export const peso = new Intl.NumberFormat(process.env.NEXT_PUBLIC_LOCALE || 'en-PH', {
  style: 'currency',
  currency: process.env.NEXT_PUBLIC_CURRENCY || 'PHP',
  minimumFractionDigits: 2,
});
