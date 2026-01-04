# Capacitor Mobile App Setup Guide

## Step 1: Install Dependencies

First, install all Capacitor dependencies:

```bash
pnpm install
```

## Step 2: Update Capacitor Configuration

Edit `capacitor.config.ts` and update:

1. **App ID**: Change `com.yourcompany.restaurant` to your actual app ID (e.g., `com.yourdomain.restaurant`)
2. **Vercel URL**: Change `https://restaurant-software.vercel.app` to your actual Vercel deployment URL

Example:
```typescript
appId: 'com.yourdomain.restaurant',
// ...
url: process.env.CAPACITOR_SERVER_URL || 'https://your-actual-app.vercel.app',
```

## Step 3: Initialize Android Platform

After installing dependencies, initialize the Android platform:

```bash
pnpm exec cap add android
```

This will create the `android/` directory with the native Android project structure.

## Step 4: Configure Android Manifests

After Android platform is initialized, create the debug manifest file:

Create `android/app/src/debug/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <!-- Allow cleartext traffic for debug builds (local development) -->
    <application 
        android:usesCleartextTraffic="true"
        tools:replace="android:usesCleartextTraffic" />
</manifest>
```

This allows HTTP connections for local development in debug builds.

## Step 5: Test Locally First (Recommended)

### Option A: Test with Local Dev Server

1. **Start your Next.js dev server:**
   ```bash
   pnpm dev
   ```

2. **In a new terminal, sync Capacitor for local development:**
   ```bash
   # For Android Emulator (use 10.0.2.2 instead of localhost)
   CAPACITOR_SERVER_URL=http://10.0.2.2:3003 pnpm cap:sync
   
   # OR for physical device on same network (use your computer's IP)
   # Find your IP: ifconfig (Mac/Linux) or ipconfig (Windows)
   CAPACITOR_SERVER_URL=http://192.168.1.XXX:3003 pnpm cap:sync
   ```
   
   **Note:** The debug AndroidManifest.xml allows HTTP for local development. This is safe for debug builds only.

3. **Open Android Studio:**
   ```bash
   pnpm cap:open:android
   ```

4. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Create/Start an Android Emulator (AVD Manager → Create Virtual Device)
   - Click the green "Run" button (or press Shift+F10)
   - The app will load your local dev server with live reload!

### Option B: Test with Production Vercel URL

1. **Make sure your app is deployed to Vercel**
2. **Update capacitor.config.ts with your Vercel URL**
3. **Sync and build:**
   ```bash
   pnpm cap:sync
   pnpm cap:open:android
   ```

## Step 6: Build and Test in Android Studio

### First Time Setup:

1. **Open Android Studio** (if not already open):
   ```bash
   pnpm cap:open:android
   ```

2. **Wait for Gradle Sync** (bottom status bar will show "Gradle sync")

3. **Set up Android Emulator** (if you don't have one):
   - Click "Device Manager" (phone icon in toolbar)
   - Click "Create Device"
   - Choose a device (e.g., Pixel 6)
   - Download a system image (e.g., API 33)
   - Finish setup

4. **Run the App:**
   - Select your emulator/device from the dropdown
   - Click the green "Run" button (▶️) or press Shift+F10
   - The app will build and launch!

### Testing Checklist:

- [ ] App launches successfully
- [ ] Login page loads
- [ ] Can login with your credentials
- [ ] Dashboard loads after login
- [ ] Navigation works (sidebar, back button)
- [ ] Offline banner appears when you disable network
- [ ] API calls work (test creating/viewing orders, menu items, etc.)

## Step 7: Build Production APK

### For Testing (Debug APK):

1. **In Android Studio:**
   - Go to: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Wait for build to complete
   - Click "locate" in the notification to find the APK
   - Install on your device: `adb install app-debug.apk`

### For Play Store (Release APK):

1. **Create a Keystore** (one-time setup):
   ```bash
   keytool -genkey -v -keystore restaurant-release.keystore -alias restaurant -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Remember the password and alias name!

2. **Store keystore securely** (don't commit to Git!)

3. **Update capacitor.config.ts** or set environment variables:
   ```bash
   export ANDROID_KEYSTORE_PATH=/path/to/restaurant-release.keystore
   export ANDROID_KEYSTORE_ALIAS=restaurant
   ```

4. **In Android Studio:**
   - Go to: `Build` → `Generate Signed Bundle / APK`
   - Select "APK"
   - Choose your keystore file
   - Enter password and alias
   - Select "release" build variant
   - Click "Finish"
   - APK will be in: `android/app/release/app-release.apk`

## Step 8: Common Issues & Solutions

### Issue: "App shows blank screen"
**Solution:** 
- Check `capacitor.config.ts` server URL is correct
- Verify Vercel deployment is live and accessible
- Check Android Studio Logcat for errors

### Issue: "ERR_CLEARTEXT_NOT_PERMITTED" or "Cannot connect to localhost:3003"
**Solution:**
- This error means Android is blocking HTTP (cleartext) traffic
- **For local development:** A debug AndroidManifest.xml has been created that allows cleartext for debug builds
- Use `10.0.2.2:3003` for Android Emulator (not `localhost`)
- Use your computer's IP address for physical device
- Make sure dev server is running
- **Important:** Debug builds allow HTTP, but release builds will only allow HTTPS (secure)

### Issue: "Cookies not working / Can't login"
**Solution:**
- Make sure you're using HTTPS in production (Vercel provides this)
- For local dev with HTTP, cookies should work in debug builds
- Production builds require HTTPS for security

### Issue: "Gradle sync failed"
**Solution:**
- Make sure Android Studio is updated
- Check internet connection (Gradle needs to download dependencies)
- Try: `File` → `Invalidate Caches` → `Invalidate and Restart`

### Issue: "Build errors"
**Solution:**
- Run `pnpm cap:sync` to sync web assets
- Clean build: `Build` → `Clean Project`, then `Build` → `Rebuild Project`

### Issue: "Using flatDir should be avoided" warning
**Solution:**
- This is a harmless warning from Gradle dependencies
- It doesn't affect functionality - you can safely ignore it
- The build completed successfully despite the warning

## Step 9: Development Workflow

### Daily Development:

1. **Make changes to your Next.js app**
2. **Deploy to Vercel** (or test locally)
3. **No need to rebuild APK!** - The app loads from Vercel URL
4. **Only rebuild APK if:**
   - You change `capacitor.config.ts`
   - You add/remove native plugins
   - You change app metadata (name, icon, etc.)

### Testing Updates:

Since your app loads from Vercel:
- Deploy changes to Vercel
- Close and reopen the app on your device
- Changes will be live immediately!

## Step 10: Play Store Preparation

### Before Submitting:

1. **Update app metadata:**
   - App name, description, screenshots
   - Privacy policy URL (required)
   - App icon and feature graphic

2. **Test on multiple devices:**
   - Different screen sizes
   - Different Android versions

3. **Prepare store listing:**
   - App category: Business / Productivity
   - Content rating: Everyone
   - Data safety section (declare Supabase data usage)

4. **Create release APK** (see Step 7)

## Quick Reference Commands

```bash
# Sync Capacitor (after config changes)
pnpm cap:sync

# Open Android Studio
pnpm cap:open:android

# Build and open Android Studio
pnpm cap:build:android

# Local dev with live reload
CAPACITOR_SERVER_URL=http://10.0.2.2:3003 pnpm cap:sync

# Production build
pnpm cap:prod:android
```

## Next Steps

1. ✅ Install dependencies (`pnpm install`)
2. ✅ Update `capacitor.config.ts` with your app ID and Vercel URL
3. ✅ Initialize Android platform (`pnpm exec cap add android`)
4. ✅ Create debug AndroidManifest.xml
5. ✅ Test locally with dev server
6. ✅ Build and test in Android Studio
7. ✅ Deploy to Vercel
8. ✅ Test production build
9. ✅ Create release keystore
10. ✅ Build release APK
11. ✅ Submit to Play Store

---

**Remember:** Most updates don't require rebuilding the APK! Just deploy to Vercel and the app will load the latest version.

