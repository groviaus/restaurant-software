---
name: Fix Route Navigation Delays - Comprehensive Optimization
overview: Comprehensive optimization plan to reduce route navigation delays from 2-4s to <500ms through parallel API calls, auth caching, query optimization, and strategic use of caching services.
todos:
  - id: parallel-api-calls
    content: Convert sequential API calls to parallel in analytics page using Promise.all()
    status: completed
  - id: navigation-loading
    content: Add loading states and useTransition for route navigation in Sidebar
    status: completed
  - id: prefetch-routes
    content: Implement route prefetching on link hover in Sidebar
    status: completed
  - id: request-scoped-auth-cache
    content: Create request-scoped auth cache helper to combine requirePermission, getUserProfile, and getEffectiveOutletId into single operation
    status: completed
  - id: optimize-protected-route
    content: Memoize permission checks and optimize ProtectedRoute component
    status: completed
  - id: add-loading-skeletons
    content: Add skeleton loaders for analytics page during data fetching
    status: completed
    dependencies:
      - parallel-api-calls
  - id: nextjs-route-config
    content: Add Next.js route segment config (dynamic, revalidate) to API routes for optimal caching
    status: completed
  - id: optimize-analytics-queries
    content: Optimize analytics queries to use database aggregations instead of fetching all data
    status: completed
  - id: client-side-cache
    content: Implement client-side caching for analytics data (similar to useSettings pattern)
    status: completed
  - id: middleware-session-refresh
    content: Create Next.js middleware to refresh Supabase sessions and reduce auth overhead
    status: cancelled
---

# Fix Route Navigation Delays - Comprehensive Optimization Plan

## Problem Analysis

The routing delay (2-4+ seconds) is caused by multiple factors:

1. **Analytics Page - Client Component with Sequential API Calls**

- `app/analytics/page.tsx` is a client component (`'use client'`)
- Makes 4 sequential API calls in `useEffect` (summary, sales-trend, payment-breakdown, orders-list)
- Each API call waits for the previous one to complete (~500ms each = 2s total)
- No server-side data prefetching
- No client-side caching

2. **API Route Auth Overhead (CRITICAL BOTTLENECK)**

- Each analytics API route (`/api/analytics/*`) performs 3 separate operations:
    - `requirePermission()` → calls `requireAuth()` → `getUser()` → Supabase `auth.getUser()` query (~100-200ms)
    - `getUserProfile()` → `getUser()` again → Supabase query to `users` table (~100-200ms)
    - `getEffectiveOutletId()` → processes profile (fast, but needs profile first)
- **Total: 2-3 Supabase queries per API call = 200-600ms overhead per call**
- **For 4 API calls: 800ms-2.4s just for auth checks!**
- No request-scoped caching - same user/profile checked 4 times

3. **ProtectedRoute Blocking**

- `src/components/layout/ProtectedRoute.tsx` checks permissions on every route change
- Uses `useAuth()` and `usePermissions()` hooks with loading states
- Blocks rendering until auth/permissions are verified
- AuthProvider has 15s timeout, Permissions has 8s timeout

4. **No Loading States During Navigation**

- Next.js `Link` component doesn't show loading state
- UI appears frozen until page data loads
- No optimistic UI updates

5. **Heavy Supabase Queries**

- Analytics summary query fetches ALL orders with nested `order_items` and `items`
- No database aggregations - calculations done in JavaScript
- Could fetch thousands of rows for month/year periods
- No query result caching

6. **No Next.js Route Segment Optimization**

- API routes don't use `export const dynamic` or `export const revalidate`
- No static/dynamic optimization
- Every request hits Supabase directly

7. **No Middleware for Session Refresh**

- No Next.js middleware to refresh Supabase sessions
- Session validation happens on every API call
- Could use middleware to pre-validate and cache

## Solution Plan

### Phase 1: Critical Performance Fixes (Immediate Impact)

#### 1.1 Parallel API Calls in Analytics Page

**File: `app/analytics/page.tsx`**

- Convert 4 sequential `await fetch()` calls to `Promise.all()`
- Expected improvement: 2-4s → 500ms-1s (longest single call)
- Add error handling for individual failures
```typescript
const [summaryRes, trendRes, paymentRes, ordersRes] = await Promise.all([
  fetch(`/api/analytics/summary?startDate=${dateRange.start}&endDate=${dateRange.end}`),
  fetch(`/api/analytics/sales-trend?startDate=${dateRange.start}&endDate=${dateRange.end}&period=${period}`),
  fetch(`/api/analytics/payment-breakdown?startDate=${dateRange.start}&endDate=${dateRange.end}`),
  fetch(`/api/analytics/orders-list?startDate=${dateRange.start}&endDate=${dateRange.end}&groupBy=${ordersGroupBy}`)
]);
```




#### 1.2 Request-Scoped Auth Cache (HIGHEST IMPACT)

**New File: `src/lib/auth/cache.ts`**Create a request-scoped cache using AsyncLocalStorage (Next.js 15+) or WeakMap to cache auth results within a single request:

```typescript
// Cache auth results for the duration of a single request
const authCache = new Map<string, { profile: User; outletId: string; timestamp: number }>();

export async function getCachedAuth(moduleName: string, action: string) {
  const cacheKey = `${moduleName}:${action}`;
  // Check cache, if exists and < 1s old, return cached
  // Otherwise fetch once and cache for request
}
```

**Files to update: `app/api/analytics/*/route.ts`**

- Replace 3 separate calls with single cached call
- Expected improvement: 200-600ms → 100-200ms per API call
- **Total savings: 400-1600ms for 4 API calls**

#### 1.3 Navigation Loading States

**File: `src/components/layout/Sidebar.tsx`**

- Use React `useTransition()` hook
- Show loading indicator on active link
- Disable navigation during transition
- Prefetch routes on hover

### Phase 2: Query and Database Optimizations

#### 2.1 Optimize Analytics Queries with Database Aggregations

**File: `app/api/analytics/summary/route.ts`**Instead of fetching all orders and calculating in JavaScript:

- Use PostgreSQL aggregations (`SUM`, `COUNT`, `AVG`)
- Use `GROUP BY` for profit calculations
- Fetch only aggregated results, not individual orders

**Before:**

```typescript
const { data: orders } = await supabase.from('orders').select('*, order_items(*, items(*))');
// Then calculate in JS: orders.reduce(...)
```

**After:**

```typescript
// Use Supabase RPC or raw SQL for aggregations
const { data } = await supabase.rpc('get_analytics_summary', {
  outlet_id: effectiveOutletId,
  start_date: start,
  end_date: end
});
```

**Expected improvement: 500ms-2s → 50-200ms for large datasets**

#### 2.2 Add Database Indexes (if missing)

**File: `src/lib/supabase/schema.sql` or migration**Verify/Add composite indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_orders_outlet_created_status 
ON orders(outlet_id, created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id_item_id 
ON order_items(order_id, item_id);
```



### Phase 3: Caching Strategies

#### 3.1 Client-Side Caching for Analytics

**File: `app/analytics/page.tsx`**Implement caching similar to `useSettings` hook:

- Cache analytics data by date range
- 5-minute cache duration
- Show cached data immediately while fetching fresh data
- Use `useMemo` for expensive calculations

#### 3.2 Next.js Route Segment Config

**Files: `app/api/analytics/*/route.ts`**Add route segment config for optimal caching:

```typescript
export const dynamic = 'force-dynamic'; // or 'auto' for static where possible
export const revalidate = 60; // Revalidate every 60 seconds for semi-static data
export const fetchCache = 'default';
```



#### 3.3 API Response Caching Headers

**Files: `app/api/analytics/*/route.ts`**Add Cache-Control headers for client-side caching:

```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
  }
});
```



### Phase 4: Next.js Middleware for Session Optimization

#### 4.1 Create Middleware for Session Refresh

**New File: `middleware.ts`**

- Refresh Supabase session before requests
- Cache session validation results
- Reduce auth overhead on API routes
```typescript
export async function middleware(request: NextRequest) {
  // Refresh Supabase session
  // Cache session for request duration
  // Pass to API routes via headers
}
```




### Phase 5: Server Component Hybrid for Analytics

#### 5.1 Convert Analytics to Server Component with Initial Data

**Files: `app/analytics/page.tsx`, `app/analytics/AnalyticsClient.tsx`**

- Create server component that fetches initial data
- Pass to client component for interactivity
- Use `loading.tsx` for better UX
- Reduces client-side fetch time

### Phase 6: Third-Party Service Recommendations

#### 6.1 Redis/Upstash for API Response Caching (OPTIONAL - High Impact)

**Service: Upstash Redis (Serverless, Free Tier Available)**

- Cache API responses with TTL
- Cache auth results across requests
- Reduce Supabase query load
- **Expected improvement: 50-80% reduction in API response time**

**Implementation:**

- Use `@upstash/redis` package
- Cache analytics API responses by date range
- Cache auth/profile data with user ID key
- 5-10 minute TTL for analytics, 1 minute for auth

#### 6.2 Vercel Edge Config (If on Vercel)

**Service: Vercel Edge Config**

- Store frequently accessed config/permissions at edge
- Ultra-fast reads (<10ms)
- Good for permission checks

#### 6.3 Supabase Database Optimizations

**Service: Supabase (Already Using)**

- Enable connection pooling (PgBouncer)
- Use read replicas for analytics queries
- Enable query performance monitoring
- Consider materialized views for complex analytics

#### 6.4 CDN for Static Assets

**Service: Vercel (Already Using) or Cloudflare**

- Ensure static assets are cached
- Use Vercel's edge network
- Optimize images/assets

## Implementation Priority

### Critical (Do First - 80% of improvement):

1. ✅ **Parallel API calls** - 2-4s → 500ms-1s
2. ✅ **Request-scoped auth cache** - 800ms-2.4s → 200-400ms savings
3. ✅ **Navigation loading states** - Better UX, perceived performance

### High Priority (Significant Improvement):

4. ✅ **Database aggregations** - 500ms-2s → 50-200ms for large datasets
5. ✅ **Client-side caching** - Instant display of cached data
6. ✅ **Next.js route config** - Better caching behavior

### Medium Priority (Nice to Have):

7. ✅ **Middleware session refresh** - Reduce auth overhead
8. ✅ **Server component hybrid** - Better initial load
9. ✅ **Database indexes** - Ensure optimal query performance

### Optional (If Budget Allows):

10. ⚠️ **Upstash Redis** - 50-80% additional improvement
11. ⚠️ **Vercel Edge Config** - For permission caching
12. ⚠️ **Supabase read replicas** - For heavy analytics queries

## Expected Results

### Without Third-Party Services:

- **Route navigation**: 2-4s → **200-500ms** (4-8x faster)
- **Analytics page load**: 2-4s → **300-600ms** (4-7x faster)
- **API response time**: 500ms-1s → **100-300ms** (2-5x faster)
- **Better UX**: Loading indicators, no frozen UI, cached data display

### With Upstash Redis (Optional):

- **Route navigation**: 2-4s → **100-300ms** (8-20x faster)
- **Analytics page load**: 2-4s → **150-400ms** (8-15x faster)
- **API response time**: 500ms-1s → **50-150ms** (5-10x faster)
- **Reduced Supabase load**: 60-80% fewer queries

## Cost Analysis

### Free/Included Services:

- Next.js caching (free)
- Client-side caching (free)
- Database indexes (free)
- Middleware (free on Vercel)

### Optional Paid Services:

- **Upstash Redis**: Free tier (10K commands/day), Pro ($0.20/100K commands)
- **Vercel Edge Config**: Included in Pro plan
- **Supabase Read Replicas**: $0.10/hour per replica

## Recommended Approach

1. **Start with Critical fixes** (Phases 1-2) - No cost, 80% improvement
2. **Add caching** (Phase 3) - No cost, additional 10-20% improvement
3. **Evaluate results** - Measure actual performance
4. **Add Upstash Redis if needed** - For remaining 10-20% improvement
5. **Consider read replicas** - Only if handling very high traffic

## Monitoring

Add performance monitoring to track improvements:

- API response times