'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Outlet } from '@/lib/types';
import { OutletForm } from '@/components/forms/OutletForm';
import { Store, Plus, BarChart3 } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { format } from 'date-fns';

interface OutletsTableProps {
  outlets: Outlet[];
  userRole: UserRole;
}

export function OutletsTable({ outlets, userRole }: OutletsTableProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto h-11 sm:h-10">
            <Plus className="h-4 w-4 mr-2" />
            Add Outlet
          </Button>
        </div>
      )}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto text-responsive-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[200px]">Address</TableHead>
                <TableHead className="min-w-[120px]">Created</TableHead>
                {isAdmin && <TableHead className="text-right min-w-[150px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {outlets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-center text-gray-500 py-8">
                    No outlets found
                  </TableCell>
                </TableRow>
              ) : (
                outlets.map((outlet) => (
                  <TableRow key={outlet.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-blue-600 hidden sm:block" />
                        {outlet.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px]">
                      {outlet.address || '-'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-gray-600">
                      {format(new Date(outlet.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/outlets/${outlet.id}`;
                          }}
                          className="h-8 sm:h-9"
                        >
                          <BarChart3 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">View Dashboard</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {isAdmin && (
        <OutletForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}

