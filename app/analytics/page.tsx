'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useOutlet } from '@/hooks/useOutlet';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  XCircle,
  Calendar,
  ChevronDown,
  Package,
  Percent,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Clock,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  CartesianGrid,
  Bar,
  BarChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Label,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface SummaryMetrics {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  cancellationRate: number;
  netProfit: number;
}

interface SalesTrendData {
  date: string;
  time?: string;
  sales: number;
  orderCount: number;
}

interface PaymentData {
  method: string;
  amount: number;
  fill: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

interface GroupedOrders {
  date: string;
  orders: Order[];
  totalSales: number;
  orderCount: number;
}

// Client-side cache for analytics data (similar to useSettings pattern)
interface AnalyticsCache {
  summary: SummaryMetrics | null;
  salesTrend: SalesTrendData[];
  paymentData: PaymentData[];
  orders: Order[];
  groupedOrders: GroupedOrders[];
  timestamp: number;
}

const analyticsCache: Record<string, AnalyticsCache> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function AnalyticsPage() {
  const router = useRouter();
  const { checkPermission, loading: permLoading } = usePermissions();
  const { profile } = useAuth();
  const { currentOutletId } = useOutlet();
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendData[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersGroupBy, setOrdersGroupBy] = useState<'none' | 'day'>('none');
  const [hasFetchedFallback, setHasFetchedFallback] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'area'>('area');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to format date as YYYY-MM-DD using IST timezone
  // The date passed in is already in UTC (converted from IST), so we need to convert back to IST to get the correct date
  const formatLocalDate = (date: Date): string => {
    // Convert UTC date back to IST to get the correct date components
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffsetMs);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate date ranges for each period - use IST timezone (Asia/Kolkata) to match dashboard and orders page
  const getDateRange = (period: TimePeriod): { start: string; end: string } => {
    const now = new Date();
    
    // Get current time in IST (UTC+5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const nowIST = new Date(now.getTime() + istOffsetMs);
    
    // Get date components in IST
    const istYear = nowIST.getUTCFullYear();
    const istMonth = nowIST.getUTCMonth();
    const istDate = nowIST.getUTCDate();

    switch (period) {
      case 'today': {
        // Calculate start of today in IST (midnight IST), then convert back to UTC
        const todayStartIST = Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0);
        const start = new Date(todayStartIST - istOffsetMs);
        // Calculate end of today in IST (midnight of tomorrow in IST), then convert back to UTC
        const todayEndIST = Date.UTC(istYear, istMonth, istDate + 1, 0, 0, 0, 0);
        const end = new Date(todayEndIST - istOffsetMs);
        return {
          start: formatLocalDate(start),
          end: formatLocalDate(end),
        };
      }
      case 'week': {
        const weekStartIST = Date.UTC(istYear, istMonth, istDate - 6, 0, 0, 0, 0);
        const start = new Date(weekStartIST - istOffsetMs);
        const weekEndIST = Date.UTC(istYear, istMonth, istDate + 1, 0, 0, 0, 0);
        const end = new Date(weekEndIST - istOffsetMs);
        return {
          start: formatLocalDate(start),
          end: formatLocalDate(end),
        };
      }
      case 'month': {
        const monthStartIST = Date.UTC(istYear, istMonth, istDate - 29, 0, 0, 0, 0);
        const start = new Date(monthStartIST - istOffsetMs);
        const monthEndIST = Date.UTC(istYear, istMonth, istDate + 1, 0, 0, 0, 0);
        const end = new Date(monthEndIST - istOffsetMs);
        return {
          start: formatLocalDate(start),
          end: formatLocalDate(end),
        };
      }
      case 'year': {
        const yearStartIST = Date.UTC(istYear - 1, istMonth, istDate, 0, 0, 0, 0);
        const start = new Date(yearStartIST - istOffsetMs);
        const yearEndIST = Date.UTC(istYear, istMonth, istDate + 1, 0, 0, 0, 0);
        const end = new Date(yearEndIST - istOffsetMs);
        return {
          start: formatLocalDate(start),
          end: formatLocalDate(end),
        };
      }
      default:
        return { start: '', end: '' };
    }
  };

  const dateRange = useMemo(() => getDateRange(period), [period]);

  // Client-side fallback fetch function (for Capacitor when API calls fail)
  const fetchDataClientSide = useCallback(async (startDate: string, endDate: string, periodType: TimePeriod) => {
    const effectiveOutletId = currentOutletId;
    if (!effectiveOutletId || !profile) {
      console.warn('[Analytics] No outlet ID or profile for client-side fetch');
      return;
    }

    try {
      const supabase = createClient();
      
      // Parse dates - use IST timezone to match server-side logic
      // The dates are already in IST boundaries, so we can use them directly
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      
      // These dates represent IST boundaries, convert to UTC for database queries
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const startIST = Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const start = new Date(startIST - istOffsetMs);
      
      const isTodayPeriod = periodType === 'today';
      let endDateForQuery: Date;
      if (isTodayPeriod) {
        // For today, endDate is tomorrow's date in IST (exclusive)
        const endIST = Date.UTC(endYear, endMonth - 1, endDay, 0, 0, 0, 0);
        endDateForQuery = new Date(endIST - istOffsetMs);
      } else {
        // For other periods, include the full end date in IST
        const endIST = Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        endDateForQuery = new Date(endIST - istOffsetMs);
      }

      console.log('[Analytics] Client-side fetch - Date range:', {
        outletId: effectiveOutletId,
        period: periodType,
        startISO: start.toISOString(),
        endISO: endDateForQuery.toISOString(),
      });

      // Fetch orders for summary
      let queryBuilder = supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          payment_method,
          order_items (
            quantity,
            price,
            items (
              profit_margin_percent
            )
          )
        `)
        .eq('outlet_id', effectiveOutletId)
        .gte('created_at', start.toISOString());

      if (isTodayPeriod) {
        queryBuilder = queryBuilder.lt('created_at', endDateForQuery.toISOString());
      } else {
        queryBuilder = queryBuilder.lte('created_at', endDateForQuery.toISOString());
      }

      const { data: ordersData, error: ordersError } = await queryBuilder;

      if (ordersError) {
        console.error('[Analytics] Error fetching orders client-side:', ordersError);
        return;
      }

      if (ordersData && ordersData.length > 0) {
        // Calculate summary metrics
        const completedOrders = ordersData.filter((o: any) => o.status === 'COMPLETED');
        const totalSales = completedOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
        const totalOrders = ordersData.length;
        const cancelledOrders = ordersData.filter((o: any) => o.status === 'CANCELLED').length;
        const averageOrderValue = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;
        const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
        
        // Calculate net profit
        let netProfit = 0;
        completedOrders.forEach((order: any) => {
          const orderProfit = order.order_items?.reduce((sum: number, oi: any) => {
            const margin = oi.items?.profit_margin_percent || 0;
            const itemTotal = Number(oi.price) * Number(oi.quantity);
            return sum + (itemTotal * margin / 100);
          }, 0) || 0;
          netProfit += orderProfit;
        });

        setSummary({
          totalSales,
          totalOrders,
          completedOrders: completedOrders.length,
          cancelledOrders,
          averageOrderValue,
          cancellationRate,
          netProfit,
        });

        // Calculate sales trend (simplified - group by day/hour)
        const trendMap = new Map<string, { sales: number; orderCount: number }>();
        completedOrders.forEach((order: any) => {
          const orderDate = new Date(order.created_at);
          let key: string;
          
          if (periodType === 'today') {
            key = `${orderDate.getHours()}:00`;
          } else {
            key = formatLocalDate(orderDate);
          }
          
          const existing = trendMap.get(key) || { sales: 0, orderCount: 0 };
          existing.sales += (Number(order.total) || 0);
          existing.orderCount += 1;
          trendMap.set(key, existing);
        });

        const trendData: SalesTrendData[] = Array.from(trendMap.entries()).map(([date, data]) => ({
          date: periodType === 'today' ? '' : date,
          time: periodType === 'today' ? date : undefined,
          sales: data.sales,
          orderCount: data.orderCount,
        })).sort((a, b) => {
          if (periodType === 'today') {
            return (a.time || '').localeCompare(b.time || '');
          }
          return a.date.localeCompare(b.date);
        });

        setSalesTrend(trendData);

        // Calculate payment breakdown
        const paymentMap = new Map<string, number>();
        completedOrders.forEach((order: any) => {
          const method = order.payment_method?.toLowerCase() || 'cash';
          const existing = paymentMap.get(method) || 0;
          paymentMap.set(method, existing + (Number(order.total) || 0));
        });

        const paymentDataArray: PaymentData[] = Array.from(paymentMap.entries()).map(([method, amount]) => ({
          method: method.charAt(0).toUpperCase() + method.slice(1),
          amount,
          fill: `var(--color-${method.toLowerCase()})`,
        }));

        setPaymentData(paymentDataArray);

        // Format orders list
        const formattedOrders: Order[] = ordersData.map((order: any) => ({
          id: order.id,
          orderNumber: order.id.slice(0, 8).toUpperCase(),
          total: Number(order.total) || 0,
          status: order.status,
          paymentMethod: order.payment_method || 'CASH',
          createdAt: order.created_at,
          items: order.order_items?.map((oi: any) => ({
            name: oi.items?.name || 'Item',
            quantity: Number(oi.quantity),
            price: Number(oi.price),
          })) || [],
        }));

        if (ordersGroupBy === 'day') {
          // Group by day
          const grouped = new Map<string, Order[]>();
          formattedOrders.forEach((order) => {
            const date = formatLocalDate(new Date(order.createdAt));
            const existing = grouped.get(date) || [];
            existing.push(order);
            grouped.set(date, existing);
          });

          const groupedArray: GroupedOrders[] = Array.from(grouped.entries()).map(([date, orders]) => ({
            date,
            orders,
            totalSales: orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0),
            orderCount: orders.length,
          })).sort((a, b) => b.date.localeCompare(a.date));

          setGroupedOrders(groupedArray);
          setOrders([]);
        } else {
          setOrders(formattedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setGroupedOrders([]);
        }
      }
    } catch (error) {
      console.error('[Analytics] Error in client-side fetch:', error);
    }
  }, [currentOutletId, profile, ordersGroupBy]);

  // Reset fallback flag when period or date range changes
  useEffect(() => {
    setHasFetchedFallback(false);
  }, [period, dateRange.start, dateRange.end]);

  // Fetch all data - PARALLEL API CALLS with client-side caching
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;

    const fetchFreshData = async (cacheKey: string) => {
      setLoading(true);
      try {
        // Fetch all 4 API endpoints in parallel using Promise.all()
        const [summaryRes, trendRes, paymentRes, ordersRes] = await Promise.all([
          fetch(
          `/api/analytics/summary?startDate=${dateRange.start}&endDate=${dateRange.end}`
          ),
          fetch(
            `/api/analytics/sales-trend?startDate=${dateRange.start}&endDate=${dateRange.end}&period=${period}`
          ),
          fetch(
            `/api/analytics/payment-breakdown?startDate=${dateRange.start}&endDate=${dateRange.end}`
          ),
          fetch(
            `/api/analytics/orders-list?startDate=${dateRange.start}&endDate=${dateRange.end}&groupBy=${ordersGroupBy}`
          ),
        ]);

        let newSummary: SummaryMetrics | null = null;
        let newSalesTrend: SalesTrendData[] = [];
        let newPaymentData: PaymentData[] = [];
        let newOrders: Order[] = [];
        let newGroupedOrders: GroupedOrders[] = [];

        // Process summary response
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          newSummary = data;
          setSummary(data);
        } else {
          console.error('Failed to fetch summary:', await summaryRes.text());
        }

        // Process sales trend response
        if (trendRes.ok) {
          const data = await trendRes.json();
          newSalesTrend = data.data || [];
          setSalesTrend(newSalesTrend);
        } else {
          console.error('Failed to fetch sales trend:', await trendRes.text());
        }

        // Process payment breakdown response
        if (paymentRes.ok) {
          const data = await paymentRes.json();
          // Format payment data - the fill will be set in the Pie component
          newPaymentData = data.data?.map((item: any) => ({
            method: item.method,
            amount: item.amount,
            fill: `var(--color-${item.method.toLowerCase()})`, // Use CSS variable format
          })) || [];
          setPaymentData(newPaymentData);
        } else {
          console.error('Failed to fetch payment breakdown:', await paymentRes.text());
        }

        // Process orders list response
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          console.log('Orders list response:', data);
          if (ordersGroupBy === 'day') {
            newGroupedOrders = data.grouped || [];
            setGroupedOrders(newGroupedOrders);
            setOrders([]); // Clear ungrouped orders
          } else {
            newOrders = data.orders || [];
            setOrders(newOrders);
            setGroupedOrders([]); // Clear grouped orders
          }
        } else {
          console.error('Failed to fetch orders list:', await ordersRes.text());
        }

        // Cache the results
        analyticsCache[cacheKey] = {
          summary: newSummary,
          salesTrend: newSalesTrend,
          paymentData: newPaymentData,
          orders: newOrders,
          groupedOrders: newGroupedOrders,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      // Create cache key based on date range, period, and groupBy
      const cacheKey = `${dateRange.start}-${dateRange.end}-${period}-${ordersGroupBy}`;
      
      // Check cache first
      const cached = analyticsCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Use cached data immediately
        setSummary(cached.summary);
        setSalesTrend(cached.salesTrend);
        setPaymentData(cached.paymentData);
        setOrders(cached.orders);
        setGroupedOrders(cached.groupedOrders);
        setLoading(false);
        
        // Still fetch fresh data in background for next time
        // (don't await, let it run in background)
        fetchFreshData(cacheKey);
        return;
      }

      // No cache or expired, fetch fresh data
      await fetchFreshData(cacheKey);
    };

    fetchData();
  }, [dateRange, ordersGroupBy, period]);

  // Client-side fallback: if summary is null or has zero values, fetch directly from Supabase
  // This is important for Capacitor apps where server-side cookies might not work
  useEffect(() => {
    const effectiveOutletId = currentOutletId;
    if (effectiveOutletId && profile && !hasFetchedFallback && dateRange.start && dateRange.end) {
      // Check if we need fallback (summary is null or has zero sales/orders)
      const needsFallback = !summary || (summary.totalSales === 0 && summary.totalOrders === 0);
      
      if (needsFallback && !loading) {
        console.log('[Analytics] Initial values are 0 or null, fetching client-side data...');
        setHasFetchedFallback(true);
        fetchDataClientSide(dateRange.start, dateRange.end, period);
      }
    }
  }, [currentOutletId, profile, summary, loading, dateRange, period, hasFetchedFallback, fetchDataClientSide]);

  useEffect(() => {
    if (!permLoading && !checkPermission('analytics', 'view')) {
      router.push('/dashboard');
    }
  }, [permLoading, checkPermission, router]);

  const totalPaymentAmount = useMemo(() => {
    return paymentData.reduce((sum, item) => sum + item.amount, 0);
  }, [paymentData]);

  const getChartColor = (method: string): string => {
    const colorMap: Record<string, string> = {
      cash: '#ea580c',
      upi: '#0891b2',
      card: '#8b5cf6',
    };
    return colorMap[method.toLowerCase()] || '#ea580c';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return 'Today';
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'year':
        return 'Last Year';
      default:
        return '';
    }
  };

  const peakHourOrDay = useMemo(() => {
    if (!salesTrend.length) return null;
    return salesTrend.reduce((max, curr) => (curr.sales > max.sales ? curr : max), salesTrend[0]);
  }, [salesTrend]);

  const cashAmount = useMemo(() => {
    return paymentData.find((p) => p.method.toLowerCase() === 'cash')?.amount || 0;
  }, [paymentData]);

  const upiAmount = useMemo(() => {
    return paymentData.find((p) => p.method.toLowerCase() === 'upi')?.amount || 0;
  }, [paymentData]);

  const cardAmount = useMemo(() => {
    return paymentData.find((p) => p.method.toLowerCase() === 'card')?.amount || 0;
  }, [paymentData]);

  const refreshCurrentData = async () => {
    setIsRefreshing(true);
    const cacheKey = `${dateRange.start}-${dateRange.end}-${period}-${ordersGroupBy}`;
    delete analyticsCache[cacheKey];
    try {
      const [summaryRes, trendRes, paymentRes, ordersRes] = await Promise.all([
        fetch(`/api/analytics/summary?startDate=${dateRange.start}&endDate=${dateRange.end}`),
        fetch(`/api/analytics/sales-trend?startDate=${dateRange.start}&endDate=${dateRange.end}&period=${period}`),
        fetch(`/api/analytics/payment-breakdown?startDate=${dateRange.start}&endDate=${dateRange.end}`),
        fetch(`/api/analytics/orders-list?startDate=${dateRange.start}&endDate=${dateRange.end}&groupBy=${ordersGroupBy}`),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (trendRes.ok) {
        const d = await trendRes.json();
        setSalesTrend(d.data || []);
      }
      if (paymentRes.ok) {
        const d = await paymentRes.json();
        setPaymentData(
          d.data?.map((item: any) => ({
            method: item.method,
            amount: item.amount,
            fill: `var(--color-${item.method.toLowerCase()})`,
          })) || []
        );
      }
      if (ordersRes.ok) {
        const d = await ordersRes.json();
        if (ordersGroupBy === 'day') {
          setGroupedOrders(d.grouped || []);
          setOrders([]);
        } else {
          setOrders(d.orders || []);
          setGroupedOrders([]);
        }
      }
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isAnalyticsLoading = loading || permLoading;

  return (
    <div className="space-y-6 pb-12">
      {/* Modern Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-card via-card/90 to-muted/30 border border-border/70 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Sales & Financial Intelligence
                </h1>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
                  Live Sync
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Executive revenue analytics, margin efficiency, payment tenders, and order throughput
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCurrentData}
            disabled={loading || isRefreshing}
            className="h-9 px-3 rounded-xl border-border/80 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs bg-card hover:bg-muted/60 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 shadow-2xs">
            <Button
              type="button"
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('area')}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                chartType === 'area' ? 'shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Smooth Area
            </Button>
            <Button
              type="button"
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                chartType === 'bar' ? 'shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Volume Bar
            </Button>
          </div>
        </div>
      </div>

      {/* Time Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid w-full sm:w-[420px] grid-cols-4 h-11 p-1 bg-muted/70 backdrop-blur-sm rounded-2xl border border-border/60 shadow-2xs">
            <TabsTrigger value="today" className="text-xs font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all">Today</TabsTrigger>
            <TabsTrigger value="week" className="text-xs font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all">7 Days</TabsTrigger>
            <TabsTrigger value="month" className="text-xs font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all">30 Days</TabsTrigger>
            <TabsTrigger value="year" className="text-xs font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all">Year</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-card px-3 py-1.5 rounded-xl border border-border/60 shadow-2xs self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>
              {dateRange.start} <span className="text-muted-foreground/60">to</span> {dateRange.end} (IST)
            </span>
          </div>
        </div>

        <TabsContent value={period} className="space-y-6 mt-0">
          {isAnalyticsLoading ? (
            <>
              {/* Skeleton Cards */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl border border-border/70 p-5 bg-card/60 backdrop-blur-sm">
                    <div className="flex items-center justify-between pb-3">
                      <Skeleton className="h-4 w-24 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-xl" />
                    </div>
                    <Skeleton className="h-9 w-32 rounded-xl mb-2" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </Card>
                ))}
              </div>
              
              {/* Skeleton Charts */}
              <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4 rounded-2xl border border-border/70 p-6">
                  <Skeleton className="h-5 w-40 mb-4 rounded-lg" />
                  <Skeleton className="h-72 w-full rounded-2xl" />
                </Card>
                <Card className="lg:col-span-3 rounded-2xl border border-border/70 p-6">
                  <Skeleton className="h-5 w-40 mb-4 rounded-lg" />
                  <Skeleton className="h-72 w-full rounded-full" />
                </Card>
              </div>
            </>
          ) : summary ? (
            <>
              {/* 4 Premium Metric Hero Tiles */}
              <div className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Net Revenue */}
                <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/70 backdrop-blur-md shadow-2xs hover:shadow-md transition-all hover:border-primary/40 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Gross Revenue
                    </CardTitle>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <DollarSign className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                      {formatCurrency(summary.totalSales)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">{summary.completedOrders} settled orders</span>
                      <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                        {getPeriodLabel()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Gross Margin */}
                <Card className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.07] via-card to-card backdrop-blur-md shadow-2xs hover:shadow-md transition-all hover:border-emerald-500/50 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Operating Margin
                    </CardTitle>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(summary.netProfit)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-500/20">
                      <span className="text-muted-foreground">
                        {((summary.netProfit / (summary.totalSales || 1)) * 100).toFixed(1)}% gross margin
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Healthy Spread
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Orders */}
                <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/70 backdrop-blur-md shadow-2xs hover:shadow-md transition-all hover:border-blue-500/40 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Order Throughput
                    </CardTitle>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
                      <ShoppingCart className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                      {summary.totalOrders}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">
                        {summary.completedOrders} ok • {summary.cancelledOrders} void
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {summary.cancellationRate.toFixed(1)}% void rate
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Ticket Average (AOV) */}
                <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/70 backdrop-blur-md shadow-2xs hover:shadow-md transition-all hover:border-purple-500/40 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Average Ticket (AOV)
                    </CardTitle>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs">
                      <Percent className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                      {formatCurrency(summary.averageOrderValue)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">Per completed checkout</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        Spend Density
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Visualizations Row */}
              <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
                {/* Sales & Orders Dynamic Trend Chart */}
                <Card className="lg:col-span-4 rounded-3xl border border-border/75 shadow-xs overflow-hidden bg-card flex flex-col">
                  <CardHeader className="p-5 sm:p-6 bg-muted/20 border-b border-border/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Sales Trajectory & Velocity
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          {getPeriodLabel()} revenue distribution across temporal intervals
                        </CardDescription>
                      </div>

                      {/* Peak indicator */}
                      {peakHourOrDay && peakHourOrDay.sales > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold self-start sm:self-auto">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Peak: {peakHourOrDay.time || peakHourOrDay.date} ({formatCurrency(peakHourOrDay.sales)})</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-center">
                    {salesTrend.length > 0 ? (
                      <ChartContainer
                        config={{
                          sales: {
                            label: 'Revenue',
                            color: 'hsl(var(--chart-1))',
                          },
                        }}
                        className="h-[280px] sm:h-[330px] w-full"
                      >
                        {chartType === 'area' ? (
                          <AreaChart
                            accessibilityLayer
                            data={salesTrend}
                            margin={{ left: -10, right: 10, top: 16, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/70" vertical={false} />
                            <XAxis
                              dataKey={period === 'today' ? 'time' : 'date'}
                              tickLine={false}
                              axisLine={false}
                              tickMargin={10}
                              tick={{ fontSize: 11, fill: 'currentColor' }}
                              tickFormatter={(value) => {
                                if (period === 'today') return value;
                                if (period === 'year') {
                                  const parts = value.split('-');
                                  const monthIdx = parseInt(parts[1], 10) - 1;
                                  const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  return mNames[monthIdx] || value;
                                }
                                if (period === 'week') {
                                  const d = new Date(value);
                                  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                                }
                                const d = new Date(value);
                                return d.toLocaleDateString('en-US', { day: 'numeric' });
                              }}
                              interval={
                                period === 'today' ? 2 :
                                period === 'week' ? 0 :
                                period === 'month' ? Math.floor(salesTrend.length / 8) : 0
                              }
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tick={{ fontSize: 11, fill: 'currentColor' }}
                              tickFormatter={(value) => (value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`)}
                            />
                            <ChartTooltip
                              cursor={{ stroke: '#ea580c', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                              content={
                                <ChartTooltipContent
                                  className="rounded-xl border border-border shadow-xl bg-card/95 backdrop-blur-md p-3"
                                  labelFormatter={(val) => {
                                    if (period === 'today') return `Hour: ${val}`;
                                    const d = new Date(val);
                                    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                                  }}
                                  formatter={(val) => [formatCurrency(val as number), 'Revenue']}
                                />
                              }
                            />
                            <Area
                              type="monotone"
                              dataKey="sales"
                              stroke="#ea580c"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#salesGradient)"
                              activeDot={{ r: 6, fill: '#ea580c', stroke: '#ffffff', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        ) : (
                          <BarChart
                            accessibilityLayer
                            data={salesTrend}
                            margin={{ left: -10, right: 10, top: 16, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/70" vertical={false} />
                            <XAxis
                              dataKey={period === 'today' ? 'time' : 'date'}
                              tickLine={false}
                              axisLine={false}
                              tickMargin={10}
                              tick={{ fontSize: 11, fill: 'currentColor' }}
                              tickFormatter={(value) => {
                                if (period === 'today') return value;
                                if (period === 'year') {
                                  const parts = value.split('-');
                                  const monthIdx = parseInt(parts[1], 10) - 1;
                                  const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  return mNames[monthIdx] || value;
                                }
                                if (period === 'week') {
                                  const d = new Date(value);
                                  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                                }
                                const d = new Date(value);
                                return d.toLocaleDateString('en-US', { day: 'numeric' });
                              }}
                              interval={
                                period === 'today' ? 2 :
                                period === 'week' ? 0 :
                                period === 'month' ? Math.floor(salesTrend.length / 8) : 0
                              }
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tick={{ fontSize: 11, fill: 'currentColor' }}
                              tickFormatter={(value) => (value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`)}
                            />
                            <ChartTooltip
                              cursor={{ fill: 'currentColor', opacity: 0.05 }}
                              content={
                                <ChartTooltipContent
                                  className="rounded-xl border border-border shadow-xl bg-card/95 backdrop-blur-md p-3"
                                  labelFormatter={(val) => {
                                    if (period === 'today') return `Hour: ${val}`;
                                    const d = new Date(val);
                                    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                                  }}
                                  formatter={(val) => [formatCurrency(val as number), 'Revenue']}
                                />
                              }
                            />
                            <Bar
                              dataKey="sales"
                              fill="#ea580c"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        )}
                      </ChartContainer>
                    ) : (
                      <div className="h-[280px] sm:h-[330px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <BarChart3 className="w-10 h-10 opacity-30" />
                        <span className="text-sm font-medium">No sales recorded for this period</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tender & Payment Mix (Donut) */}
                <Card className="lg:col-span-3 rounded-3xl border border-border/75 shadow-xs overflow-hidden bg-card flex flex-col">
                  <CardHeader className="p-5 sm:p-6 bg-muted/20 border-b border-border/60">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <Coins className="w-4 h-4 text-primary" />
                      Payment Tender Mix
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Breakdown by Cash, UPI, and Card transactions
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    {paymentData.length > 0 && totalPaymentAmount > 0 ? (
                      <>
                        <div className="relative flex items-center justify-center">
                          <ChartContainer
                            config={{
                              cash: { label: 'Cash', color: '#ea580c' },
                              upi: { label: 'UPI', color: '#0891b2' },
                              card: { label: 'Card', color: '#8b5cf6' },
                            }}
                            className="mx-auto aspect-square max-h-[210px] w-full"
                          >
                            <PieChart>
                              <ChartTooltip
                                cursor={false}
                                content={
                                  <ChartTooltipContent
                                    className="rounded-xl border border-border shadow-xl bg-card/95 backdrop-blur-md p-2.5"
                                    formatter={(value) => formatCurrency(value as number)}
                                    hideLabel
                                  />
                                }
                              />
                              <Pie
                                data={paymentData}
                                dataKey="amount"
                                nameKey="method"
                                innerRadius={58}
                                outerRadius={82}
                                strokeWidth={3}
                                stroke="var(--color-card, #fff)"
                                paddingAngle={3}
                              >
                                {paymentData.map((entry, index) => {
                                  const method = entry.method.toLowerCase();
                                  const color = method === 'cash' ? '#ea580c' : method === 'upi' ? '#0891b2' : '#8b5cf6';
                                  return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                                <Label
                                  content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                      return (
                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 6} className="fill-foreground text-lg sm:text-xl font-black">
                                            {formatCurrency(totalPaymentAmount)}
                                          </tspan>
                                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 14} className="fill-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                            Total Settled
                                          </tspan>
                                        </text>
                                      );
                                    }
                                  }}
                                />
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                        </div>

                        {/* Modern Detailed Tender Strips */}
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          {paymentData.map((item, index) => {
                            const percentage = ((item.amount / totalPaymentAmount) * 100).toFixed(1);
                            const method = item.method.toLowerCase();
                            const isCash = method === 'cash';
                            const isUpi = method === 'upi';
                            const color = isCash ? '#ea580c' : isUpi ? '#0891b2' : '#8b5cf6';
                            const IconComponent = isCash ? Wallet : isUpi ? Smartphone : CreditCard;

                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${color}18`, color: color }}
                                  >
                                    <IconComponent className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-foreground capitalize truncate">
                                      {item.method}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {percentage}% of gross volume
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-black text-foreground">
                                    {formatCurrency(item.amount)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <PieChartIcon className="w-10 h-10 opacity-30" />
                        <span className="text-sm font-medium">No payment data recorded</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Settled & Processed Orders Audit Log */}
              <Card className="rounded-3xl border border-border/75 shadow-xs overflow-hidden bg-card">
                <CardHeader className="p-5 sm:p-6 bg-muted/20 border-b border-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                        Audit Ledger: Orders & Transactions
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Itemized receipt breakdowns and settlement history for {getPeriodLabel().toLowerCase()}
                      </CardDescription>
                    </div>
                    <Select
                      value={ordersGroupBy}
                      onValueChange={(value) => setOrdersGroupBy(value as 'none' | 'day')}
                    >
                      <SelectTrigger className="w-full sm:w-[190px] h-9 rounded-xl border-border/80 text-xs font-medium bg-background shadow-2xs">
                        <SelectValue placeholder="Group by" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none" className="text-xs">Flat List (Recent First)</SelectItem>
                        <SelectItem value="day" className="text-xs">Group by Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {ordersGroupBy === 'day' ? (
                    <div className="space-y-4">
                      {groupedOrders.length > 0 ? (
                        groupedOrders.map((group) => (
                          <div key={group.date} className="space-y-2 rounded-2xl border border-border/60 p-3 bg-muted/10">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 px-3 bg-muted/40 rounded-xl border border-border/50">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs sm:text-sm text-foreground">{group.date}</h3>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-muted-foreground">
                                  {group.orderCount} {group.orderCount === 1 ? 'order' : 'orders'}
                                </span>
                                <span className="font-black text-foreground">
                                  {formatCurrency(group.totalSales)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2 pt-1">
                              {group.orders.map((order) => (
                                <OrderRow key={order.id} order={order} formatCurrency={formatCurrency} />
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-semibold text-muted-foreground">
                            No orders found in this timeframe
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {orders.length > 0 ? (
                        orders.map((order) => (
                          <OrderRow key={order.id} order={order} formatCurrency={formatCurrency} />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-semibold text-muted-foreground">
                            No orders found in this timeframe
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Package className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No analytics data available for this range</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Modern Order Row Component
function OrderRow({ order, formatCurrency }: { order: Order; formatCurrency: (amount: number) => string }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'PREPARING':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border/60';
    }
  };

  const method = order.paymentMethod?.toLowerCase() || 'cash';
  const isCash = method === 'cash';
  const isUpi = method === 'upi';
  const IconComponent = isCash ? Wallet : isUpi ? Smartphone : CreditCard;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 sm:p-4 hover:border-primary/30 hover:shadow-2xs transition-all">
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-1 rounded-lg border border-border/60">
            {order.orderNumber}
          </div>
          <Badge variant="outline" className={`${getStatusColor(order.status)} text-[11px] font-bold px-2 py-0.5 rounded-md`}>
            {order.status}
          </Badge>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 border border-border/50 text-[11px] font-medium text-muted-foreground">
            <IconComponent className="w-3 h-3 text-primary" />
            <span className="capitalize">{order.paymentMethod}</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground/70" />
            <span>
              {new Date(order.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="font-black text-sm sm:text-base text-foreground min-w-[70px] text-right">
            {formatCurrency(order.total)}
          </div>
          <div className={`w-7 h-7 rounded-lg bg-muted/50 border border-border/60 flex items-center justify-center text-muted-foreground transition-transform duration-200 shrink-0 ${expanded ? 'rotate-180 bg-primary/10 text-primary border-primary/20' : ''}`}>
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-2 animate-in fade-in-50 duration-150">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Itemized Details ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
          </div>
          <div className="rounded-xl border border-border/60 divide-y divide-border/50 overflow-hidden bg-muted/15">
            {order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                      {item.quantity}×
                    </span>
                    <span className="font-medium text-foreground truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground shrink-0 ml-3">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 text-xs text-muted-foreground text-center">
                No individual item breakdown available for this receipt
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
