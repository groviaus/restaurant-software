import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { OutletsTable } from '@/components/tables/OutletsTable';
import { Store, ShieldCheck, MapPin, Building2, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function OutletsPage() {
  await requirePermission('outlets', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);
  const supabase = await createClient();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Authentication Required</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Please log in with appropriate credentials to access branch locations and outlet settings.
        </p>
      </div>
    );
  }

  // Admins can see all outlets, others see only their outlet
  let query = supabase.from('outlets').select('*');

  if (profile.role !== 'admin' && profile.outlet_id) {
    query = query.eq('id', profile.outlet_id);
  }

  const { data: outlets, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-2">
        <h2 className="text-base font-bold text-destructive">Error Loading Outlets</h2>
        <p className="text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Outlets & Branches
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {profile.role === 'admin'
              ? 'Multi-outlet architecture: configure physical stores, table plans, and operational contexts'
              : 'View your assigned restaurant outlet information and digital menu QR codes'}
          </p>
        </div>
      </div>

      {/* Outlets List Component */}
      <OutletsTable
        outlets={outlets || []}
        userRole={profile.role as any}
        currentOutletId={effectiveOutletId}
      />
    </div>
  );
}
