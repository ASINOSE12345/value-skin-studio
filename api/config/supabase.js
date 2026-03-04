const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('SUPABASE_URL no configurado - usando almacenamiento en memoria');
}

// Cliente con service key para operaciones del servidor (bypass RLS)
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Cliente con anon key para operaciones del cliente
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper para verificar si Supabase esta disponible
const isSupabaseConfigured = () => {
  return supabaseAdmin !== null;
};

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured
};
