import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://qhyflzufryzcwmqjiyjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeWZsenVmcnl6Y3dtcWppeWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjA3NTksImV4cCI6MjA1NDkzNjc1OX0.wOO5F7EU-C4ZZnBiVHpPsOp4HDagvOfBqUZdqP56rU4';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
