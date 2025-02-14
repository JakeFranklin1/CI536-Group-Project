import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/**
 * @constant {string} supabaseUrl
 * @description The URL of the Supabase project.
 *              This URL is used to connect to the Supabase database.
 */
const supabaseUrl = "https://qhyflzufryzcwmqjiyjv.supabase.co";

/**
 * @constant {string} supabaseAnonKey
 * @description The anonymous key for the Supabase project.
 *              This key is used to authenticate requests to the Supabase database.
 *              It has limited permissions and should not be used for sensitive operations.
 */
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeWZsenVmcnl6Y3dtcWppeWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjA3NTksImV4cCI6MjA1NDkzNjc1OX0.wOO5F7EU-C4ZZnBiVHpPsOp4HDagvOfBqUZdqP56rU4";

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
