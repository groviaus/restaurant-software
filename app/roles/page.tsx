'use client';

import { useState, useEffect } from 'react';
import { Role } from '@/lib/types';
import { RolesTable } from '@/components/roles/RolesTable';
import { RoleForm } from '@/components/roles/RoleForm';
import { Loader2, Shield, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Roles & Security
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              RBAC Matrix
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure system roles, access policies, and granular module permissions (view, create, edit, delete)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <RoleForm onSuccess={fetchRoles} />
        </div>
      </div>

      {/* Metric Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Configured Roles</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {roles.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>RBAC Protected Modules</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            12 Modules
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Enforcement Engine</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-1">
            Active & Enforced
          </p>
        </div>
      </div>

      {/* Roles Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 bg-card rounded-2xl border border-border/60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading role definitions...</p>
        </div>
      ) : (
        <RolesTable roles={roles} onRefresh={fetchRoles} />
      )}
    </div>
  );
}
