import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/**
 * @constant {string} supabaseUrl
 * @description The URL of the Supabase project.
 *              This URL is used to connect to the Supabase database.
 */
const supabaseUrl = "https://hnjouksbfheupmkttlvd.supabase.co";

/**
 * @constant {string} supabaseAnonKey
 * @description The anonymous key for the Supabase project.
 *              This key is used to authenticate requests to the Supabase database.
 *              It has limited permissions and should not be used for sensitive operations.
 */
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhuam91a3NiZmhldXBta3R0bHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzYyNjMsImV4cCI6MjA4ODExMjI2M30.Qs-xV_41Ths20m3LA6chH0z-xds9JGqahTo0I_UbAIQ";

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
