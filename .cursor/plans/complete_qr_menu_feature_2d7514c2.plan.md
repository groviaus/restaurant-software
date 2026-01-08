---
name: Complete QR Menu Feature
overview: Complete the QR menu feature by adding an admin interface for QR code generation/download on the outlets page, improving the customer-facing QR menu display with outlet information, better styling, error handling, and fixing existing issues.
todos:
  - id: fix_syntax_error
    content: Fix syntax error in app/qr-menu/page.tsx (incomplete reduce function on line 64)
    status: completed
  - id: create_qr_modal
    content: Create src/components/outlets/QRCodeModal.tsx component for displaying and downloading QR codes
    status: completed
  - id: enhance_qr_menu
    content: "Enhance app/qr-menu/page.tsx: add outlet info, remove QR code display, improve styling and error handling"
    status: completed
    dependencies:
      - fix_syntax_error
  - id: add_qr_button
    content: Add 'Generate QR Code' button to OutletsTable component with QRCodeModal integration
    status: completed
    dependencies:
      - create_qr_modal
  - id: improve_qr_api
    content: "Optional: Improve app/api/qr/[outletId]/route.ts with outlet validation and better error handling"
    status: completed
  - id: create_outlet_api
    content: Create app/api/outlets/[id]/route.ts for fetching individual outlet details
    status: completed
  - id: create_ui_components
    content: Create missing UI components (Alert and Skeleton) for enhanced QR menu page
    status: completed
---

# Complete

QR Menu Feature

## Overview

Complete the QR menu feature by adding admin functionality to generate and download QR codes from the outlets management page, and enhance the customer-facing QR menu page with outlet information, better styling, error handling, and UX improvements.

## Current State

- ✅ QR code generation API exists at `/api/qr/[outletId]`
- ✅ Customer-facing QR menu page exists at `/qr-menu`
- ❌ No admin interface to generate/download QR codes
- ❌ QR menu page doesn't show outlet information
- ❌ QR menu page shows QR code to customers (should be admin-only)
- ❌ Missing error handling and loading states
- ❌ Syntax error in QR menu page (line 64 - incomplete reduce function)

## Implementation Plan

### 1. Fix QR Menu Page Syntax Error

**File**: `app/qr-menu/page.tsx`

- Fix incomplete `reduce` function on line 64
- The function is missing the opening parenthesis and callback parameters

### 2. Enhance QR Menu Page (Customer-Facing)

**File**: `app/qr-menu/page.tsx`**Changes**:

- Remove QR code display from customer-facing page (customers shouldn't see QR codes)
- Fetch and display outlet information (name, address)
- Add outlet header with name and address
- Improve styling and layout
- Add proper error handling for missing outlet or menu items
- Add empty state when no menu items available
- Improve loading states
- Add better mobile responsiveness

### 3. Add QR Code Generation to Outlets Page

**File**: `src/components/tables/OutletsTable.tsx`**Changes**:

- Add "Generate QR Code" button for each outlet (admin only)
- Add QR code modal/dialog component to display and download QR codes
- Integrate with existing `/api/qr/[outletId]` endpoint
- Show QR code preview with download option
- Display menu URL for easy sharing

### 4. Create QR Code Modal Component

**File**: `src/components/outlets/QRCodeModal.tsx` (new)**Features**:

- Display QR code image
- Show menu URL
- Download QR code button
- Copy URL to clipboard button
- Responsive design
- Close button

### 5. Update QR Code API (if needed)

**File**: `app/api/qr/[outletId]/route.ts`**Potential improvements**:

- Validate outlet exists before generating QR code
- Return outlet information in response (optional)
- Better error messages

### 6. Add QR Code Link to Outlets Detail Page

**File**: `app/outlets/[id]/page.tsx` (if exists) or create it**Features**:

- Display QR code for specific outlet
- Download option
- Share functionality

## Data Flow

```javascript
Admin clicks "Generate QR" → 
  Opens QRCodeModal → 
    Fetches QR code from /api/qr/[outletId] → 
      Displays QR code and menu URL → 
        Admin can download or copy URL

Customer scans QR code → 
  Opens /qr-menu?outlet=[id] → 
    Fetches outlet info and menu items → 
      Displays menu grouped by category
```



## Files to Create

1. `src/components/outlets/QRCodeModal.tsx` - Modal component for QR code display and download

## Files to Modify

1. `app/qr-menu/page.tsx` - Fix syntax error, add outlet info, improve styling, remove QR code display
2. `src/components/tables/OutletsTable.tsx` - Add "Generate QR Code" button and integrate QRCodeModal
3. `app/api/qr/[outletId]/route.ts` - Optional: Add outlet validation and better error handling

## Key Features

### Admin Side

- Generate QR code for any outlet from outlets page
- Preview QR code in modal
- Download QR code as PNG
- Copy menu URL to clipboard
- View menu URL for sharing

### Customer Side

- Clean, professional menu display
- Outlet name and address header
- Menu items grouped by category
- Responsive design for mobile/tablet
- Proper error handling
- Loading states

## Implementation Details

### QRCodeModal Component

- Uses Dialog component from shadcn/ui
- Fetches QR code image from API
- Displays QR code with download button
- Shows menu URL with copy functionality
- Handles loading and error states

### QR Menu Page Enhancements

- Fetch outlet information from API
- Display outlet name and address at top
- Remove QR code section (admin-only feature)
- Better category grouping display
- Improved card styling
- Empty state when no items
- Error state for invalid outlet

### OutletsTable Integration

- Add "Generate QR" button next to "View Dashboard"
- Open QRCodeModal on click
- Pass outlet ID to modal
- Handle modal state

## Testing Checklist

- [ ] Admin can generate QR code from outlets page
- [ ] QR code downloads correctly
- [ ] Menu URL copies to clipboard
- [ ] Customer-facing menu displays outlet info
- [ ] Menu items display correctly grouped by category
- [ ] Error handling works for invalid outlet