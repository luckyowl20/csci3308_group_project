const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://your-project-id.supabase.co',
  'your-anon-or-service-role-key' // service_role if uploading securely from backend
);

module.exports = supabase;
