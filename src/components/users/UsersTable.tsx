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
import { User } from '@/lib/types';
import { Edit, Trash2, User as UserIcon, Shield, Mail, Calendar, Store, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UsersTableProps {
  users: (User & { roles?: { name: string }; outlets?: { name: string } })[];
  onRefresh: () => void;
}

export function UsersTable({ users, onRefresh }: UsersTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      toast.success('User deleted successfully');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const getDisplayRole = (user: any) => {
    if (user.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Shield className="w-3 h-3" />
          Admin
        </span>
      );
    }
    const roleName = user.roles?.name || user.role || 'Staff';
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border/60">
        <UserIcon className="w-3 h-3" />
        {roleName}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
              <TableHead className="py-3.5 pl-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Staff Member
              </TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Role & Permissions
              </TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Joined Date
              </TableHead>
              <TableHead className="py-3.5 pr-5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <UserIcon className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No user accounts found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="py-3 pl-5 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shadow-2xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">{user.name}</p>
                        <span className="text-[11px] text-muted-foreground font-mono">ID: {user.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {getDisplayRole(user)}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                      {format(new Date(user.created_at), 'dd MMM yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toast.info('Edit staff profile from user settings')}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Edit profile"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        onClick={() => setDeleteId(user.id)}
                        disabled={user.role === 'admin'}
                        title={user.role === 'admin' ? 'Admins cannot be deleted' : 'Delete user'}
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

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border/70 p-6">
            <UserIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No users found.</p>
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shadow-2xs shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                    </div>
                  </div>
                  {getDisplayRole(user)}
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Joined {format(new Date(user.created_at), 'dd MMM yyyy')}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() => setDeleteId(user.id)}
                      disabled={user.role === 'admin'}
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

      {/* Confirmation Dialog (Single Close Cross / Alert Modal) */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[440px] rounded-2xl border border-border/80 shadow-2xl p-5">
          <AlertDialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-1 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Staff Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action will permanently delete this account and revoke system access. Active orders and historical ledger movements associated with this account will remain intact for audit compliance.
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
              {loading ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
