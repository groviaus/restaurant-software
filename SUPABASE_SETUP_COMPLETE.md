# ✅ Supabase Setup Complete!

I've successfully set up your Supabase database using the MCP tools. Here's what was done:

## ✅ Completed Steps

### 1. Database Schema Applied
- ✅ All 6 tables created: `outlets`, `users`, `items`, `tables`, `orders`, `order_items`
- ✅ All indexes created for optimal performance
- ✅ All triggers created for automatic `updated_at` timestamps
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ All RLS policies created for role-based access control
- ✅ Security warning fixed (function search_path)

### 2. Initial Data Created
- ✅ **Outlet Created**: "Main Restaurant" 
  - **Outlet ID**: `b96fdc91-23c3-48b3-a7d3-f3397eb2e067`
  - Save this ID - you'll need it when creating users!

### 3. Environment Variables
- ✅ `.env.local` file created with:
  - `NEXT_PUBLIC_SUPABASE_URL`: https://frhzrhxjdkxyjpbpyyxx.supabase.co
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: ✅ Set
  - `SUPABASE_SERVICE_ROLE_KEY`: ⚠️ **NEEDS TO BE ADDED MANUALLY**

## ⚠️ Remaining Steps (Manual)

### Step 1: Get Service Role Key

The service role key is sensitive and not exposed via MCP. You need to get it manually:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/frhzrhxjdkxyjpbpyyxx
2. Click **Settings** (gear icon) → **API**
3. Find **"service_role"** key in the "Project API keys" section
4. Copy it (it starts with `eyJ...`)
5. Open `.env.local` and replace `your_service_role_key_here` with the actual key

### Step 2: Create Your First User

You need to create a user in Supabase Auth, then link it to the `users` table.

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@restaurant.com` (or your email)
   - **Password**: Create a strong password
   - **Auto Confirm User**: ✅ Turn this ON
4. Click **"Create user"**
5. **Copy the User ID** (UUID) from the user list

#### Option B: Via Sign Up (Alternative)

1. Go to your app: http://localhost:3000/login
2. Click "Sign up" (if available) or use the email/password you want
3. After signing up, go to Supabase Dashboard → **Authentication** → **Users**
4. Find your user and **copy the User ID**

### Step 3: Link User to Outlet

After you have the User ID from Step 2, run this SQL in Supabase SQL Editor:

```sql
-- Replace USER_ID_HERE with the actual UUID from Authentication → Users
-- The outlet_id is already set: b96fdc91-23c3-48b3-a7d3-f3397eb2e067

INSERT INTO users (id, name, email, role, outlet_id)
VALUES (
  'USER_ID_HERE',  -- Paste the User ID from Step 2
  'Admin User',     -- Your name
  'admin@restaurant.com',  -- Your email
  'admin',          -- Role: admin, cashier, or staff
  'b96fdc91-23c3-48b3-a7d3-f3397eb2e067'  -- The outlet ID
);
```

Or I can help you do this via MCP if you provide the User ID!

### Step 4: Enable Email Auth (if not already enabled)

1. Go to **Settings** → **Authentication** in Supabase
2. Scroll to **"Email Auth"**
3. Make sure **"Enable Email Signup"** is ON
4. For development, turn OFF **"Enable email confirmations"** (optional, makes testing easier)

### Step 5: Test Your Setup

1. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Open your browser:**
   - Go to http://localhost:3000
   - You should be redirected to `/login`

3. **Login:**
   - Use the email and password you created
   - You should see the dashboard!

## 📊 Current Database State

- **Tables**: 6 tables created ✅
- **Outlet**: 1 outlet created ✅
- **Users**: 0 users (you need to create one)
- **Items**: 0 items (add via UI after login)
- **Tables**: 0 tables (add via UI after login)

## 🔑 Important IDs to Save

- **Outlet ID**: `b96fdc91-23c3-48b3-a7d3-f3397eb2e067`
- **Project URL**: `https://frhzrhxjdkxyjpbpyyxx.supabase.co`

## 🚀 Next Steps After Login

Once you're logged in, you can:
1. Add menu items via the Menu page
2. Add tables via the Tables page
3. Create orders via the Orders page
4. Test billing functionality

## 🆘 Need Help?

If you get stuck:
1. Check the browser console for errors
2. Check the terminal where `npm run dev` is running
3. Verify your `.env.local` has all three keys set correctly
4. Make sure you restarted the dev server after updating `.env.local`

## 📝 Quick Reference

**Your Supabase Project:**
- Dashboard: https://supabase.com/dashboard/project/frhzrhxjdkxyjpbpyyxx
- SQL Editor: https://supabase.com/dashboard/project/frhzrhxjdkxyjpbpyyxx/sql
- Table Editor: https://supabase.com/dashboard/project/frhzrhxjdkxyjpbpyyxx/editor

**Your App:**
- Local: http://localhost:3000
- Login: http://localhost:3000/login

