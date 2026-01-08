'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  XCircle,
  Calendar,
  ChevronDown,
  Package,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { CartesianGrid, Bar, BarChart, XAxis, YAxis, Pie, PieChart, Label } from 'recharts';
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

type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface SummaryMetrics {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  cancellationRate: number;
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

export default function AnalyticsPage() {
  const router = useRouter();
  const { checkPermission, loading: permLoading } = usePermissions();
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendData[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersGroupBy, setOrdersGroupBy] = useState<'none' | 'day'>('none');

  useEffect(() => {
    if (!permLoading && !checkPermission('analytics', 'view')) {
      router.push('/dashboard');
    }
  }, [permLoading, checkPermission, router]);

  if (permLoading) {
    return <div className="flex justify-center p-8">Loading...</div>; // Or use Loader2
  }

  // Helper function to get chart colors
  const getChartColor = (method: string): string => {
    const colorMap: Record<string, string> = {
      'cash': '#ea580c',    // Orange (chart-1)
      'upi': '#0891b2',     // Cyan (chart-2)
      'card': '#0f766e',    // Teal (chart-3)
    };
    return colorMap[method.toLowerCase()] || '#ea580c';
  };

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate date ranges for each period
  const getDateRange = (period: TimePeriod): { start: string; end: string } => {
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = now.getMonth();
    const localDate = now.getDate();
    const today = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);

    switch (period) {
      case 'today': {
        const start = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);
        return {
          start: formatLocalDate(start),
          end: formatLocalDate(end),
        };
      }
      case 'week': {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
        return {
          start: formatLocalDate(start),
          end: formatLocalDate(end),
        };
      }
      case 'month': {
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
        return {
          start: formatLocalDate(start),
          end: formatLocalDate(end),
        };
      }
      case 'year': {
        const start = new Date(today);
        start.setFullYear(start.getFullYear() - 1);
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
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

  // Fetch all data
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch summary metrics
        const summaryRes = await fetch(
          `/api/analytics/summary?startDate=${dateRange.start}&endDate=${dateRange.end}`
        );
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSummary(data);
        }

        // Fetch sales trend
        const trendRes = await fetch(
          `/api/analytics/sales-trend?startDate=${dateRange.start}&endDate=${dateRange.end}&period=${period}`
        );
        if (trendRes.ok) {
          const data = await trendRes.json();
          setSalesTrend(data.data || []);
        }

        // Fetch payment breakdown
        const paymentRes = await fetch(
          `/api/analytics/payment-breakdown?startDate=${dateRange.start}&endDate=${dateRange.end}`
        );
        if (paymentRes.ok) {
          const data = await paymentRes.json();
          // Format payment data - the fill will be set in the Pie component
          const formattedPayment: PaymentData[] = data.data?.map((item: any) => ({
            method: item.method,
            amount: item.amount,
            fill: `var(--color-${item.method.toLowerCase()})`, // Use CSS variable format
          })) || [];
          setPaymentData(formattedPayment);
        }

        // Fetch orders list
        const ordersRes = await fetch(
          `/api/analytics/orders-list?startDate=${dateRange.start}&endDate=${dateRange.end}&groupBy=${ordersGroupBy}`
        );
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          console.log('Orders list response:', data);
          if (ordersGroupBy === 'day') {
            setGroupedOrders(data.grouped || []);
            setOrders([]); // Clear ungrouped orders
          } else {
            setOrders(data.orders || []);
            setGroupedOrders([]); // Clear grouped orders
          }
        } else {
          console.error('Failed to fetch orders list:', await ordersRes.text());
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, ordersGroupBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'year': return 'Last Year';
      default: return '';
    }
  };

  const totalPaymentAmount = useMemo(() => {
    return paymentData.reduce((sum, item) => sum + item.amount, 0);
  }, [paymentData]);

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-8 pt-3 sm:pt-4 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Comprehensive sales and performance insights
          </p>
        </div>
      </div>

      {/* Time Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full max-w-full sm:max-w-md grid-cols-4 h-10 sm:h-11">
          <TabsTrigger value="today" className="text-xs sm:text-sm">Today</TabsTrigger>
          <TabsTrigger value="week" className="text-xs sm:text-sm">7 Days</TabsTrigger>
          <TabsTrigger value="month" className="text-xs sm:text-sm">30 Days</TabsTrigger>
          <TabsTrigger value="year" className="text-xs sm:text-sm">Year</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-24" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded animate-pulse w-32 mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : summary ? (
            <>
              {/* Key Metrics Cards */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Total Sales
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold break-words">{formatCurrency(summary.totalSales)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.completedOrders} completed orders
                    </p>
                    <div className="flex items-center mt-2 text-xs text-emerald-600">
                      <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{getPeriodLabel()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Total Orders
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold">{summary.totalOrders}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.completedOrders} completed, {summary.cancelledOrders} cancelled
                    </p>
                    <div className="flex items-center mt-2 text-xs text-blue-600">
                      <Package className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Active period</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Avg. Order Value
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold break-words">{formatCurrency(summary.averageOrderValue)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Per completed order
                    </p>
                    <div className="flex items-center mt-2 text-xs text-purple-600">
                      <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Average value</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Cancellation Rate
                    </CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold">{summary.cancellationRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.cancelledOrders} of {summary.totalOrders} orders
                    </p>
                    <div className="flex items-center mt-2 text-xs text-red-600">
                      {summary.cancellationRate > 10 ? (
                        <><TrendingDown className="h-3 w-3 mr-1 flex-shrink-0" /><span className="truncate">Needs attention</span></>
                      ) : (
                        <><TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" /><span className="truncate">Healthy</span></>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-7">
                {/* Sales Trend Chart */}
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Sales Trend</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{getPeriodLabel()}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {salesTrend.length > 0 ? (
                      <ChartContainer
                        config={{
                          sales: {
                            label: 'Sales',
                            color: 'hsl(var(--chart-1))',
                          },
                        }}
                        className="h-[250px] sm:h-[300px] w-full"
                      >
                        <BarChart
                          accessibilityLayer
                          data={salesTrend}
                          margin={{
                            left: 0,
                            right: 0,
                            top: 12,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                          <XAxis
                            dataKey={period === 'today' ? 'time' : 'date'}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              if (period === 'today') {
                                // Show time for today view (hours)
                                return value;
                              } else if (period === 'year') {
                                // Show month abbreviation for year view (Jan, Feb, etc.)
                                const [year, month] = value.split('-');
                                const monthIndex = parseInt(month) - 1;
                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                return monthNames[monthIndex] || month;
                              } else if (period === 'week') {
                                // Show day and date for week view
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                              } else {
                                // Show date for month view
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { day: 'numeric' });
                              }
                            }}
                            interval={
                              period === 'today' ? 2 :
                                period === 'week' ? 0 :
                                  period === 'month' ? Math.floor(salesTrend.length / 10) :
                                    period === 'year' ? 0 :
                                      'preserveStartEnd'
                            }
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              if (value >= 1000) {
                                return `₹${(value / 1000).toFixed(1)}k`;
                              }
                              return `₹${value}`;
                            }}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                labelFormatter={(value) => {
                                  if (period === 'today') {
                                    return `Time: ${value}`;
                                  } else if (period === 'year') {
                                    const [year, month] = value.split('-');
                                    const monthIndex = parseInt(month) - 1;
                                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                    return `${monthNames[monthIndex]} ${year}`;
                                  } else {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric'
                                    });
                                  }
                                }}
                                formatter={(value) => [`₹${value}`, 'Sales']}
                              />
                            }
                          />
                          <Bar
                            dataKey="sales"
                            fill="var(--color-sales)"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                        No sales data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Methods Chart */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Payment Methods</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{getPeriodLabel()}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {paymentData.length > 0 ? (
                      <div className="space-y-4">
                        <ChartContainer
                          config={paymentData.reduce((acc, item) => {
                            // Create consistent color mapping for each payment method
                            // Use var(--chart-{number}) format like shadcn examples
                            const colorMap: Record<string, string> = {
                              'cash': 'var(--chart-1)',  // Orange/Red
                              'upi': 'var(--chart-2)',   // Blue
                              'card': 'var(--chart-3)',  // Green
                            };
                            const key = item.method.toLowerCase();
                            acc[key] = {
                              label: item.method,
                              color: colorMap[key] || 'var(--chart-1)',
                            };
                            return acc;
                          }, {} as ChartConfig)}
                          className="mx-auto aspect-square max-h-[200px] sm:max-h-[250px]"
                        >
                          <PieChart>
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  formatter={(value) => formatCurrency(value as number)}
                                  hideLabel
                                />
                              }
                            />
                            <Pie
                              data={paymentData}
                              dataKey="amount"
                              nameKey="method"
                              innerRadius={50}
                              strokeWidth={5}
                            >
                              <Label
                                content={({ viewBox }) => {
                                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                    return (
                                      <text
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                      >
                                        <tspan
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                          className="fill-foreground text-lg sm:text-xl font-bold"
                                        >
                                          {formatCurrency(totalPaymentAmount)}
                                        </tspan>
                                        <tspan
                                          x={viewBox.cx}
                                          y={(viewBox.cy || 0) + 18}
                                          className="fill-muted-foreground text-xs"
                                        >
                                          Total
                                        </tspan>
                                      </text>
                                    );
                                  }
                                }}
                              />
                            </Pie>
                          </PieChart>
                        </ChartContainer>

                        {/* Legend */}
                        <div className="space-y-2">
                          {paymentData.map((item, index) => {
                            const percentage = ((item.amount / totalPaymentAmount) * 100).toFixed(1);
                            const color = getChartColor(item.method);

                            return (
                              <div key={index} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2 flex-1">
                                  <div
                                    className="w-4 h-4 rounded-sm flex-shrink-0 border border-border/50"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-xs sm:text-sm font-medium capitalize">{item.method}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs sm:text-sm text-muted-foreground">{percentage}%</span>
                                  <span className="text-xs sm:text-sm font-semibold min-w-[60px] sm:min-w-[80px] text-right">
                                    {formatCurrency(item.amount)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                        No payment data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Orders List */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Orders List</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        All orders for {getPeriodLabel().toLowerCase()}
                      </CardDescription>
                    </div>
                    <Select
                      value={ordersGroupBy}
                      onValueChange={(value) => setOrdersGroupBy(value as 'none' | 'day')}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Group by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No grouping</SelectItem>
                        <SelectItem value="day">Group by day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordersGroupBy === 'day' ? (
                    <div className="space-y-3 sm:space-y-4">
                      {groupedOrders.length > 0 ? (
                        groupedOrders.map((group) => (
                          <div key={group.date} className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 px-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <h3 className="font-semibold text-sm sm:text-base">{group.date}</h3>
                              </div>
                              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                <span className="text-muted-foreground">
                                  {group.orderCount} orders
                                </span>
                                <span className="font-semibold">
                                  {formatCurrency(group.totalSales)}
                                </span>
                              </div>
                            </div>
                            <div className="pl-0 sm:pl-4 space-y-2">
                              {group.orders.map((order) => (
                                <OrderRow key={order.id} order={order} formatCurrency={formatCurrency} />
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 sm:py-12">
                          <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                          <p className="text-base sm:text-lg font-medium text-muted-foreground mb-1">
                            No orders found
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground px-4">
                            No orders were placed during this period. Try selecting a different time range.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.length > 0 ? (
                        orders.map((order) => (
                          <OrderRow key={order.id} order={order} formatCurrency={formatCurrency} />
                        ))
                      ) : (
                        <div className="text-center py-8 sm:py-12">
                          <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                          <p className="text-base sm:text-lg font-medium text-muted-foreground mb-1">
                            No orders found
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground px-4">
                            No orders were placed during this period. Try selecting a different time range.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No data available for this period</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Order Row Component
function OrderRow({ order, formatCurrency }: { order: Order; formatCurrency: (amount: number) => string }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'PREPARING': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <div className="border rounded-lg p-2 sm:p-3 hover:bg-muted/50 transition-colors">
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="font-mono text-xs sm:text-sm font-medium">{order.orderNumber}</div>
          <Badge variant="outline" className={`${getStatusColor(order.status)} text-xs`}>
            {order.status}
          </Badge>
          <Badge variant="outline" className="capitalize text-xs hidden sm:inline-flex">
            {order.paymentMethod}
          </Badge>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="font-semibold text-sm sm:text-base min-w-[80px] sm:min-w-[100px] text-right">
            {formatCurrency(order.total)}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && order.items.length > 0 && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs sm:text-sm py-1">
              <span className="text-muted-foreground truncate mr-2">
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
