import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/**
 * @constant {string} supabaseUrl
 * @description The URL of the Supabase project.
 *              This URL is used to connect to the Supabase database.
 *              ⚠️ UPDATE THIS with your new Supabase project URL from:
 *              Supabase Dashboard → Project Settings → API → Project URL
 */
const supabaseUrl = "YOUR_NEW_SUPABASE_URL";

/**
 * @constant {string} supabaseAnonKey
 * @description The anonymous key for the Supabase project.
 *              This key is used to authenticate requests to the Supabase database.
 *              It has limited permissions and should not be used for sensitive operations.
 *              ⚠️ UPDATE THIS with your new anon key from:
 *              Supabase Dashboard → Project Settings → API → Project API Keys → anon public
 */
const supabaseAnonKey =
    "YOUR_NEW_SUPABASE_ANON_KEY";

/**
 * @constant {object} supabase
 * @description The Supabase client.
 *              This client is used to interact with the Supabase database.
 */
// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * @exports supabase
 * @description The Supabase client.
 *              This client is used to interact with the Supabase database.
 */
export default supabase;
