'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Role } from '@/lib/types';
import { Edit, Trash2, Shield, ChevronRight, AlertTriangle, Calendar, KeyRound, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface RolesTableProps {
  roles: Role[];
  onRefresh: () => void;
}

export function RolesTable({ roles, onRefresh }: RolesTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete role');
      toast.success('Role deleted successfully');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete role');
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
              <TableHead className="py-3.5 pl-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Role Name
              </TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Description / Purpose
              </TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Created Date
              </TableHead>
              <TableHead className="py-3.5 pr-5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Configure
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No roles defined yet</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow
                  key={role.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="py-3.5 pl-5 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                        <Shield className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">{role.name}</p>
                        <span className="text-[11px] text-muted-foreground font-mono">ID: {role.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 text-xs text-muted-foreground max-w-[320px]">
                    <span className="line-clamp-1">{role.description || 'No description provided'}</span>
                  </TableCell>
                  <TableCell className="py-3.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                      {format(new Date(role.created_at), 'dd MMM yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/roles/${role.id}`)}
                        className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/70 hover:bg-primary/5 hover:text-primary cursor-pointer gap-1"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                        Permissions Matrix
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        onClick={() => setDeleteId(role.id)}
                        title="Delete role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {roles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border/70 p-6">
            <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No roles found.</p>
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div
                  className="flex items-start justify-between gap-2 cursor-pointer"
                  onClick={() => router.push(`/roles/${role.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{role.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{role.description || 'No description'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created {format(new Date(role.created_at), 'dd MMM yyyy')}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/roles/${role.id}`)}
                      className="h-8 px-2 text-xs text-primary"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() => setDeleteId(role.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[440px] rounded-2xl border border-border/80 shadow-2xl p-5">
          <AlertDialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-1 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Security Role?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action cannot be undone. Removing this role will revoke all associated access privileges for any staff member currently assigned to this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 border-t border-border/60 flex-row justify-end gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={loading}
              className="h-9 px-4 text-xs font-semibold rounded-xl border-border/70"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-9 px-4 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
