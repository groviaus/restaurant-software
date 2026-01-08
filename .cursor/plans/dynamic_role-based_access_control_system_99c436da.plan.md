---
name: Dynamic Role-Based Access Control System
overview: Implement a dynamic role-based access control system where admins can create custom roles, assign granular permissions (view/edit/create/delete) to modules, and create user credentials with these roles. Add "order_taker" role with access to Orders and Bills modules only.
todos:
  - id: db-schema
    content: "Create database schema: roles, modules, role_permissions tables and update users table via Supabase MCP"
    status: pending
  - id: seed-modules
    content: Seed initial modules (orders, bills, menu, inventory, tables, reports, analytics, outlets, qr-menu, dashboard) in database
    status: pending
    dependencies:
      - db-schema
  - id: update-types
    content: Update types.ts with Role, Module, RolePermission interfaces and update User interface
    status: pending
    dependencies:
      - db-schema
  - id: permission-utils
    content: Create permission checking utilities in auth.ts (checkPermission, getUserPermissions, requirePermission)
    status: pending
    dependencies:
      - update-types
  - id: api-routes
    content: Create API routes for roles, modules, role-permissions, and users management
    status: pending
    dependencies:
      - permission-utils
  - id: admin-ui-roles
    content: Create admin UI pages and components for roles management (list, create, edit, assign permissions)
    status: pending
    dependencies:
      - api-routes
  - id: admin-ui-users
    content: Create admin UI pages and components for users management (list, create, edit, assign roles)
    status: pending
    dependencies:
      - api-routes
  - id: update-sidebar
    content: Update Sidebar to filter navigation items based on user permissions
    status: pending
    dependencies:
      - permission-utils
  - id: update-protected-route
    content: Update ProtectedRoute component to check permissions in addition to roles
    status: pending
    dependencies:
      - permission-utils
  - id: update-module-pages
    content: Add permission checks to Orders, Bills, and other module pages, hide action buttons based on permissions
    status: pending
    dependencies:
      - update-protected-route
  - id: create-order-taker
    content: Create 'order_taker' role with view permissions for Orders and Bills modules only
    status: pending
    dependencies:
      - admin-ui-roles
  - id: test-system
    content: Test creating custom roles, assigning permissions, creating users, and verifying order_taker access restrictions
    status: pending
    dependencies:
      - create-order-taker
      - update-module-pages
---

# D

ynamic Role-Based Access Control System

## Overview

Implement a flexible role-based access control (RBAC) system that allows admins to:

1. Create custom roles with any name
2. Assign granular permissions (view/edit/create/delete) to specific modules
3. Create user credentials and assign roles
4. Add "order_taker" role that can only access Orders and Bills modules

## Database Schema Changes

### New Tables (via Supabase MCP)

1. **`roles` table** - Stores custom role definitions

- `id` (UUID, primary key)
- `name` (TEXT, unique) - e.g., "order_taker", "manager", "waiter"
- `description` (TEXT, optional)
- `created_at`, `updated_at`

2. **`modules` table** - Defines available system modules

- `id` (UUID, primary key)
- `name` (TEXT, unique) - e.g., "orders", "bills", "menu", "inventory"
- `display_name` (TEXT) - e.g., "Orders", "Bills"
- `icon` (TEXT, optional) - icon name for UI
- `created_at`

3. **`role_permissions` table** - Maps roles to module permissions

- `id` (UUID, primary key)
- `role_id` (UUID, references roles)
- `module_id` (UUID, references modules)
- `can_view` (BOOLEAN, default false)
- `can_create` (BOOLEAN, default false)
- `can_edit` (BOOLEAN, default false)
- `can_delete` (BOOLEAN, default false)
- `created_at`, `updated_at`
- Unique constraint on (role_id, module_id)

4. **Update `users` table**

- Add `role_id` (UUID, references roles, nullable) - for custom roles
- Keep existing `role` (TEXT) for backward compatibility with admin/cashier/staff
- Migration: Add column, update CHECK constraint to allow both systems

### RLS Policies

- Admins can manage all roles, modules, and role_permissions
- Users can view their own assigned role and permissions
- Add policies for role_permissions table

## Backend Changes

### 1. Update Type Definitions ([src/lib/types.ts](src/lib/types.ts))

- Add `Role`, `Module`, `RolePermission` interfaces
- Update `User` interface to include `role_id`
- Add permission checking types

### 2. Create Permission Utilities ([src/lib/auth.ts](src/lib/auth.ts))

- Add `checkPermission(userId, module, action)` function
- Add `getUserPermissions(userId)` function
- Add `requirePermission(module, action)` server function
- Update `requireRole` to work with both old and new role systems

### 3. API Routes

**New Routes:**

- `app/api/roles/route.ts` - CRUD for roles (admin only)
- `app/api/modules/route.ts` - List available modules (admin only)
- `app/api/role-permissions/route.ts` - Manage role permissions (admin only)
- `app/api/users/route.ts` - Create users with roles (admin only)
- `app/api/users/[id]/route.ts` - Update user role assignments (admin only)

**Update Existing Routes:**

- Add permission checks to all existing API routes (orders, bills, menu, etc.)
- Use `requirePermission` instead of just `requireRole` where appropriate

### 4. Database Migration

- Create migration SQL file for new tables
- Update existing schema.sql
- Seed initial modules (orders, bills, menu, inventory, tables, reports, analytics, outlets, qr-menu, dashboard)

## Frontend Changes

### 1. Admin Interface Pages

**New Pages:**

- `app/roles/page.tsx` - List all roles, create/edit roles
- `app/roles/[id]/page.tsx` - Edit role and assign permissions
- `app/users/page.tsx` - List users, create new users with role assignment
- `app/users/[id]/page.tsx` - Edit user, change role assignment

**Components:**

- `components/roles/RolesTable.tsx` - Display roles list
- `components/roles/RoleForm.tsx` - Create/edit role form
- `components/roles/PermissionMatrix.tsx` - Checkbox grid for assigning permissions to modules
- `components/users/UsersTable.tsx` - Display users list
- `components/users/UserForm.tsx` - Create/edit user form with role selection
- `components/users/RoleSelector.tsx` - Dropdown to select role when creating user

### 2. Update Sidebar ([src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx))

- Filter navigation items based on user permissions
- Only show modules user has `can_view` permission for
- Add "Roles" and "Users" links for admins only

### 3. Update Protected Routes ([src/components/layout/ProtectedRoute.tsx](src/components/layout/ProtectedRoute.tsx))

- Add permission-based protection
- Check both role and permissions before allowing access

### 4. Update Page Components

- Add permission checks to Orders page (`app/orders/page.tsx`)
- Add permission checks to Bills page (`app/bills/page.tsx`)
- Add permission checks to all other module pages
- Hide action buttons (create/edit/delete) based on permissions

## Implementation Steps

1. **Database Setup** (via Supabase MCP)

- Create roles, modules, role_permissions tables
- Seed initial modules
- Update users table schema
- Create RLS policies

2. **Backend Foundation**

- Update types.ts with new interfaces
- Create permission checking utilities in auth.ts
- Create API routes for roles, modules, permissions, users

3. **Frontend Admin Interface**

- Create roles management pages
- Create users management pages
- Create permission assignment UI

4. **Integration**

- Update Sidebar to filter by permissions
- Update ProtectedRoute for permission checks
- Update all module pages with permission checks
- Add "order_taker" role with Orders and Bills view permissions

5. **Testing**

- Test creating custom roles
- Test assigning permissions
- Test creating users with roles
- Test order_taker can only see Orders and Bills

## Key Files to Modify/Create

**Database:**

- Migration SQL file for new tables
- Update `src/lib/supabase/schema.sql`

**Backend:**

- `src/lib/types.ts` - Add new interfaces
- `src/lib/auth.ts` - Add permission checking functions
- `app/api/roles/route.ts` - New
- `app/api/modules/route.ts` - New
- `app/api/role-permissions/route.ts` - New
- `app/api/users/route.ts` - New
- `app/api/users/[id]/route.ts` - New

**Frontend:**

- `app/roles/page.tsx` - New
- `app/roles/[id]/page.tsx` - New
- `app/users/page.tsx` - New
- `app/users/[id]/page.tsx` - New
- `components/roles/*` - New components
- `components/users/*` - New components
- `src/components/layout/Sidebar.tsx` - Update
- `src/components/layout/ProtectedRoute.tsx` - Update
- `app/orders/page.tsx` - Add permission checks
- `app/bills/page.tsx` - Add permission checks

## Permission Model

Each module will have 4 permission types:

- **View**: Can see the module/page
- **Create**: Can create new records
- **Edit**: Can modify existing records
- **Delete**: Can delete records

For "order_taker" role: