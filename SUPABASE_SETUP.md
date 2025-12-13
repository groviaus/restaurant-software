# Supabase Integration Guide - Step by Step

This guide will walk you through setting up Supabase for your Restaurant POS system.

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"** button
3. Fill in the project details:
   - **Name**: `restaurant-pos` (or any name you prefer)
   - **Database Password**: Create a strong password (save it somewhere safe - you'll need it)
   - **Region**: Choose the region closest to you
   - **Pricing Plan**: Select **Free** (this gives you plenty for development)
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be set up

## Step 2: Get Your API Keys

1. Once your project is ready, click on **Settings** (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. You'll see several sections. Find these values:

   **Project URL:**
   - Look for "Project URL" section
   - Copy the URL (looks like: `https://xxxxxxxxxxxxx.supabase.co`)

   **API Keys:**
   - Find the "Project API keys" section
   - You'll see two keys:
     - **anon public** key - This is safe to expose in client-side code
     - **service_role** key - This is SECRET, never expose it publicly

4. Copy these three values:
   - Project URL
   - anon public key
   - service_role key

## Step 3: Update Your .env.local File

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **"New query"** button
3. Open the file `src/lib/supabase/schema.sql` from your project
4. Copy ALL the contents of that file
5. Paste it into the SQL Editor in Supabase
6. Click **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
7. You should see "Success. No rows returned" message
8. This creates all the tables, indexes, and security policies

## Step 5: Verify Tables Were Created

1. In Supabase dashboard, click on **Table Editor** in the left sidebar
2. You should see these tables:
   - `outlets`
   - `users`
   - `items`
   - `tables`
   - `orders`
   - `order_items`

If you see all these tables, the schema setup was successful!

## Step 6: Create Your First Outlet

1. In the **Table Editor**, click on the `outlets` table
2. Click the **"Insert"** button (or the "+" icon)
3. Add a new row:
   - **name**: `Main Restaurant` (or your restaurant name)
   - **address**: `123 Main Street` (optional)
4. Click **"Save"**
5. **IMPORTANT**: Copy the `id` of this outlet (it's a UUID) - you'll need it in the next step

## Step 7: Enable Email Authentication (for login)

1. Go to **Settings** → **Authentication**
2. Scroll down to **"Email Auth"**
3. Make sure **"Enable Email Signup"** is turned ON
4. For development, you can disable **"Confirm email"** to make testing easier:
   - Scroll to **"Email Auth"** settings
   - Turn OFF **"Enable email confirmations"** (for now, you can enable it later for production)

## Step 8: Create Your First User

### Option A: Using Supabase Dashboard (Easier for first user)

1. Go to **Authentication** → **Users** in the left sidebar
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@restaurant.com` (or your email)
   - **Password**: Create a strong password
   - **Auto Confirm User**: Turn this ON (so you don't need email confirmation)
4. Click **"Create user"**
5. **IMPORTANT**: Copy the User ID (UUID) - you'll see it in the user list

### Option B: Using SQL (Alternative method)

1. Go to **SQL Editor**
2. Run this query (replace the values):

```sql
-- First, create the user in auth.users (this happens automatically when you sign up)
-- But for now, we'll create the profile in the users table
-- Replace 'USER_ID_FROM_AUTH' with the actual user ID from Authentication → Users

INSERT INTO users (id, name, email, role, outlet_id)
VALUES (
  'USER_ID_FROM_AUTH',  -- Get this from Authentication → Users
  'Admin User',
  'admin@restaurant.com',
  'admin',
  'OUTLET_ID_FROM_STEP_6'  -- The outlet ID you copied in Step 6
);
```

## Step 9: Link User to Outlet

1. Go to **Table Editor** → **users** table
2. Click **"Insert"** button
3. Fill in:
   - **id**: Paste the User ID from Step 8
   - **name**: `Admin User` (or your name)
   - **email**: The email you used in Step 8
   - **role**: `admin` (this gives full access)
   - **outlet_id**: Paste the outlet ID from Step 6
4. Click **"Save"**

## Step 10: Test Your Setup

1. **Restart your Next.js dev server:**
   - Stop the current server (Ctrl+C or Cmd+C)
   - Run `npm run dev` again
   - This loads the new environment variables

2. **Open your browser:**
   - Go to `http://localhost:3000`
   - You should be redirected to `/dashboard`
   - Since you're not logged in, you should be redirected to `/login`

3. **Test Login:**
   - Use the email and password you created in Step 8
   - You should be able to log in and see the dashboard

## Step 11: Create Some Test Data (Optional but Recommended)

### Add Menu Items:

1. Go to **Table Editor** → **items** table
2. Click **"Insert"** and add some items:
   - **outlet_id**: Your outlet ID
   - **name**: `Chicken Biryani`
   - **price**: `250`
   - **category**: `Main Course`
   - **available**: `true`

3. Add a few more items to test with

### Add Tables:

1. Go to **Table Editor** → **tables** table
2. Click **"Insert"** and add tables:
   - **outlet_id**: Your outlet ID
   - **name**: `Table 1`
   - **capacity**: `4`
   - **status**: `EMPTY`

## Troubleshooting

### "Invalid API key" error:
- Double-check your `.env.local` file
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env.local`

### "User not found" error:
- Make sure you created the user in both Authentication → Users AND Table Editor → users
- The IDs must match

### "Cannot read properties" errors:
- Make sure you ran the schema.sql file completely
- Check that all tables exist in Table Editor

### Login not working:
- Check Authentication → Users to see if your user exists
- Make sure email confirmations are disabled for testing
- Check browser console for errors

## Next Steps

Once everything is working:
1. You can create more users with different roles (cashier, staff)
2. Add more menu items
3. Start creating orders through the UI
4. Test the billing functionality

## Security Notes

- Never commit `.env.local` to git (it's already in .gitignore)
- The `service_role` key bypasses Row Level Security - only use it server-side
- For production, enable email confirmations and use stronger passwords
- Review the RLS policies in the schema to understand access control

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Check the browser console for detailed error messages
- Check the terminal where `npm run dev` is running for server errors

