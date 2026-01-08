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
import { Edit, Trash2, Shield, MoreVertical, ChevronRight } from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

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
        } catch (error) {
            toast.error('Failed to delete role');
        } finally {
            setLoading(false);
            setDeleteId(null);
        }
    };

    // Mobile Card View
    const MobileRoleCard = ({ role }: { role: Role }) => (
        <Card className="mb-3">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => router.push(`/roles/${role.id}`)}
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{role.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {role.description || 'No description'}
                            </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                        Created {new Date(role.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/roles/${role.id}`)}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setDeleteId(role.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No roles found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            {role.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">{role.description || '-'}</TableCell>
                                    <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/roles/${role.id}`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeleteId(role.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
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
            <div className="md:hidden">
                {roles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No roles found.</p>
                        <p className="text-sm">Create one to get started.</p>
                    </div>
                ) : (
                    roles.map((role) => <MobileRoleCard key={role.id} role={role} />)
                )}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the role
                            and remove permissions for any users currently assigned to it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel disabled={loading} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
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
        </>
    );
}
