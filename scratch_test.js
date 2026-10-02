require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('query_pg_policies', { query: "select * from pg_policies where tablename = 'job_applications'" });
  console.log("Policies:", data, error);
}
run();
