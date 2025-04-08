const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eeipkpztknsbjvzdxkwr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaXBrcHp0a25zYmp2emR4a3dyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzczMTA3NCwiZXhwIjoyMDU5MzA3MDc0fQ.C8mvxKDAvssdCQHkXlv0qEKJ2V5rpewhCke30Yxc490' // service_role if uploading securely from backend
);
module.exports = supabase;