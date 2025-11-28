// Script to check if image_urls column exists in experience_submissions table
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImageUrlsColumn() {
  console.log('🔍 Checking image_urls column in experience_submissions table...\n');

  // Get recent submissions
  const { data: submissions, error } = await supabase
    .from('experience_submissions')
    .select('id, company_name, experience_type, created_at, image_urls')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching submissions:', error.message);
    return;
  }

  console.log(`📊 Found ${submissions.length} recent submissions:\n`);

  submissions.forEach((sub, index) => {
    console.log(`${index + 1}. ${sub.company_name} (${sub.experience_type})`);
    console.log(`   ID: ${sub.id}`);
    console.log(`   Created: ${new Date(sub.created_at).toLocaleDateString('ko-KR')}`);

    if (sub.image_urls && Array.isArray(sub.image_urls) && sub.image_urls.length > 0) {
      console.log(`   ✅ Images: ${sub.image_urls.length}개`);
      sub.image_urls.forEach((url, i) => {
        console.log(`      ${i + 1}. ${url.substring(0, 80)}...`);
      });
    } else {
      console.log(`   ⚠️ Images: 없음 (${sub.image_urls})`);
    }
    console.log('');
  });

  // Check for journalist submissions specifically
  const { data: journalistSubs, error: journalistError } = await supabase
    .from('experience_submissions')
    .select('id, company_name, created_at, image_urls')
    .eq('experience_type', 'journalist')
    .order('created_at', { ascending: false })
    .limit(5);

  if (journalistError) {
    console.error('❌ Error fetching journalist submissions:', journalistError.message);
    return;
  }

  console.log('\n📋 Journalist (실계정 기자단) submissions:\n');

  if (journalistSubs.length === 0) {
    console.log('⚠️ No journalist submissions found.');
  } else {
    journalistSubs.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.company_name}`);
      console.log(`   ID: ${sub.id}`);
      console.log(`   Created: ${new Date(sub.created_at).toLocaleDateString('ko-KR')}`);

      if (sub.image_urls && Array.isArray(sub.image_urls) && sub.image_urls.length > 0) {
        console.log(`   ✅ Images: ${sub.image_urls.length}개`);
      } else {
        console.log(`   ⚠️ Images: 없음`);
      }
      console.log('');
    });
  }
}

checkImageUrlsColumn()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
