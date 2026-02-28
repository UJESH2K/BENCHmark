/**
 * Backend Supabase client  (uses SERVICE_ROLE key → bypasses RLS)
 */
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
let _ready = false;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  // quick health check
  supabase.from("arena_state").select("id").limit(1)
    .then(({ error }) => {
      if (error) {
        console.warn("[Supabase] Tables not found — running in-memory only. Run supabase/schema.sql in the SQL Editor.");
        _ready = false;
      } else {
        _ready = true;
        console.log("[Supabase] ✅ Connected and tables verified");
      }
    });
} else {
  console.warn("[Supabase] No SUPABASE_URL / SUPABASE_SERVICE_KEY → in-memory only");
}

function isReady() { return _ready && supabase !== null; }

module.exports = { supabase, isReady };
