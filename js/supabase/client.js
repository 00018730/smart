import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://imdqpbxqrxrlbxlqeeju.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZHFwYnhxcnhybGJ4bHFlZWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDYzMjAsImV4cCI6MjA4NDgyMjMyMH0.YeM4pZ-0Xw4lR0SmyNrhtosrZBjlRhsj3CKVhKSg_LY";

// Adding 'export' makes this accessible to login.js
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("🟢 Supabase client exported");