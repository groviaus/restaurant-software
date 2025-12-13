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
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Outlet
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Created</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {outlets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="text-center text-gray-500">
                  No outlets found
                </TableCell>
              </TableRow>
            ) : (
              outlets.map((outlet) => (
                <TableRow key={outlet.id}>
                  <TableCell className="font-medium">{outlet.name}</TableCell>
                  <TableCell>{outlet.address || '-'}</TableCell>
                  <TableCell>
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
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Dashboard
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

