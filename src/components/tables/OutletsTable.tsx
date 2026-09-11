'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Outlet, UserRole } from '@/lib/types';
import { OutletForm } from '@/components/forms/OutletForm';
import { QRCodeModal } from '@/components/outlets/QRCodeModal';
import {
  Store,
  Plus,
  BarChart3,
  CheckCircle2,
  QrCode,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Building2,
  Sparkles,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useOutlet } from '@/hooks/useOutlet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OutletsTableProps {
  outlets: Outlet[];
  userRole: UserRole;
  currentOutletId?: string | null;
}

export function OutletsTable({ outlets, userRole, currentOutletId }: OutletsTableProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const { switchOutlet } = useOutlet();
  const [switching, setSwitching] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<{ id: string; name: string } | null>(null);
  const [deleteOutlet, setDeleteOutlet] = useState<Outlet | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = userRole === UserRole.ADMIN;

  const handleDeleteOutlet = async () => {
    if (!deleteOutlet) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/outlets/${deleteOutlet.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete outlet');
      }

      toast.success(data.message || `Outlet "${deleteOutlet.name}" deleted`);
      setDeleteOutlet(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete outlet');
    } finally {
      setDeleting(false);
    }
  };

  const handleSwitchOutlet = async (outletId: string) => {
    if (outletId === currentOutletId) {
      return;
    }

    setSwitching(outletId);
    try {
      await switchOutlet(outletId);
      toast.success('Active outlet switched successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch outlet');
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 backdrop-blur-sm p-4 rounded-2xl border border-border/70 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Restaurant Outlets
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/60">
                {outlets.length} {outlets.length === 1 ? 'Location' : 'Locations'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Switch branch context, download customer table QR codes, or manage branch details
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setFormOpen(true)}
            size="sm"
            className="h-9 px-4 rounded-xl text-xs font-semibold shadow-xs gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Outlet
          </Button>
        )}
      </div>

      {/* Outlets Grid */}
      {outlets.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/80 bg-muted/10">
          <CardContent className="py-14 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
              <Store className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No outlets configured yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create your first branch location to begin taking orders, configuring tables, and tracking inventory.
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setFormOpen(true)}
                size="sm"
                className="h-8 text-xs rounded-xl shadow-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Outlet
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {outlets.map((outlet) => {
            const isActive = currentOutletId === outlet.id;

            return (
              <Card
                key={outlet.id}
                className={cn(
                  'rounded-2xl border transition-all duration-200 overflow-hidden relative group hover:shadow-md',
                  isActive
                    ? 'border-primary/50 bg-gradient-to-br from-primary/[0.03] to-transparent shadow-xs ring-1 ring-primary/20'
                    : 'border-border/70 bg-card hover:border-border'
                )}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <div className="h-1 w-full bg-primary absolute top-0 left-0 right-0" />
                )}

                <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                  {/* Top Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                          )}
                        >
                          <Store className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                            {outlet.name}
                          </h3>
                          <span className="text-[11px] font-mono text-muted-foreground block truncate">
                            ID: {outlet.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="h-3 w-3" />
                          Active Context
                        </Badge>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/40 border border-border/50 shrink-0">
                          Standby
                        </span>
                      )}
                    </div>

                    {/* Address & Meta */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground min-h-[36px]">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/80" />
                        <span className="line-clamp-2 leading-relaxed">
                          {outlet.address || 'No physical address specified'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>Created {format(new Date(outlet.created_at), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {!isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchOutlet(outlet.id)}
                          disabled={switching === outlet.id}
                          className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/70 hover:bg-primary/5 hover:text-primary cursor-pointer gap-1"
                        >
                          {switching === outlet.id ? (
                            'Switching...'
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Set Active
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOutlet({ id: outlet.id, name: outlet.name });
                          setQrModalOpen(true);
                        }}
                        className="h-8 px-2.5 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer gap-1"
                        title="View table QR code"
                      >
                        <QrCode className="h-3.5 w-3.5 text-primary" />
                        Menu QR
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(`/dashboard`);
                        }}
                        className="h-8 px-2.5 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer gap-1"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Metrics
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteOutlet(outlet)}
                          className="h-8 w-8 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete outlet"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      {isAdmin && (
        <OutletForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {selectedOutlet && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          outletId={selectedOutlet.id}
          outletName={selectedOutlet.name}
        />
      )}

      {/* Delete Outlet Confirmation Modal */}
      <AlertDialog
        open={!!deleteOutlet}
        onOpenChange={(open) => !open && setDeleteOutlet(null)}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[440px] rounded-2xl border border-border/80 shadow-2xl p-5">
          <AlertDialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-1 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Outlet &quot;{deleteOutlet?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action will permanently delete the outlet location. Active user sessions will be unlinked and all items, tables, and records associated with this branch will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 border-t border-border/60 flex-row justify-end gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="h-9 px-4 text-xs font-semibold rounded-xl border-border/70 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-9 px-4 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteOutlet();
              }}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Outlet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
