const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 설정되지 않았습니다: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  const sql = fs.readFileSync('supabase/migrations/20250117_blog_distribution_daily_records.sql', 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`Error in statement ${i + 1}:`, error);
        console.error('Statement:', statement.substring(0, 100) + '...');
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`Exception in statement ${i + 1}:`, err.message);
    }
  }

  console.log('\nMigration completed!');
}

runMigration().catch(console.error);
