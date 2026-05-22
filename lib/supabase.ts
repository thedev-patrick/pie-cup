import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service-role client — server-side only, never expose to the browser
export const supabase = createClient(supabaseUrl, supabaseKey);
