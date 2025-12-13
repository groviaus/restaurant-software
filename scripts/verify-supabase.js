/**
 * Quick script to verify Supabase connection
 * Run with: node scripts/verify-supabase.js
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verifying Supabase Configuration...\n');

// Check if variables exist
if (!SUPABASE_URL || SUPABASE_URL.includes('your_supabase')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set or still has placeholder value');
  console.log('   Please update .env.local with your Supabase Project URL\n');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('your_supabase')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or still has placeholder value');
  console.log('   Please update .env.local with your Supabase anon key\n');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.includes('your_supabase')) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set or still has placeholder value');
  console.log('   Please update .env.local with your Supabase service_role key\n');
  process.exit(1);
}

// Check URL format
if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL format looks incorrect');
  console.log('   Should be: https://xxxxxxxxxxxxx.supabase.co\n');
  process.exit(1);
}

// Check key format (JWT tokens start with eyJ)
if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY format looks incorrect');
  console.log('   Should start with "eyJ" (JWT token)\n');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY.startsWith('eyJ')) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY format looks incorrect');
  console.log('   Should start with "eyJ" (JWT token)\n');
  process.exit(1);
}

console.log('✅ Environment variables are set correctly!');
console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`);
console.log(`   Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`   Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...\n`);

console.log('📋 Next Steps:');
console.log('   1. Make sure you ran the SQL schema in Supabase SQL Editor');
console.log('   2. Create at least one outlet in the outlets table');
console.log('   3. Create a user in Authentication → Users');
console.log('   4. Add the user to the users table with a role');
console.log('   5. Restart your dev server: npm run dev\n');

console.log('✨ Setup looks good! You can now start the dev server.\n');

