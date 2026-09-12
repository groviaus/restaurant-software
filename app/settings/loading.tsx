import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, Building2, Receipt, ShoppingBag, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Outlet Preferences
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 min-w-16 inline-flex items-center justify-center">
              <Skeleton className="h-3 w-14" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure taxation compliance, thermal receipt layouts, business profiles, and POS behaviors
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            disabled
            className="h-9 px-4 rounded-xl text-xs font-semibold shadow-xs gap-1.5 opacity-80"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Modern Tabs Shell */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 w-full sm:max-w-2xl h-11 p-1 bg-muted/60 rounded-2xl border border-border/60">
          <div className="text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 bg-card text-foreground shadow-xs">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Tax & GST</span>
          </div>
          <div className="text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>Business</span>
          </div>
          <div className="text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 text-muted-foreground">
            <Receipt className="h-3.5 w-3.5" />
            <span>Receipt & Bill</span>
          </div>
          <div className="text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 text-muted-foreground">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Orders & Print</span>
          </div>
        </div>

        {/* Card Form Skeletons */}
        <Card className="rounded-3xl border border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-48 mb-1" />
            <Skeleton className="h-3.5 w-72" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="p-4 rounded-2xl border border-border/60 bg-muted/30 flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 p-3.5 rounded-2xl border border-border/60 bg-muted/20">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
