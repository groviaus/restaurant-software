'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '@/lib/types';
import { useOutlet } from '@/hooks/useOutlet';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

export default function CategoriesPage() {
    const router = useRouter();
    const { currentOutlet } = useOutlet();
    const { checkPermission, loading: permLoading } = usePermissions();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        display_order: 0,
    });

    useEffect(() => {
        if (!permLoading && !checkPermission('menu', 'view')) {
            router.push('/dashboard');
        }
    }, [permLoading, checkPermission, router]);

    useEffect(() => {
        if (currentOutlet && !permLoading && checkPermission('menu', 'view')) {
            fetchCategories();
        }
    }, [currentOutlet, permLoading, checkPermission]);

    if (permLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const fetchCategories = async () => {
        if (!currentOutlet) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/categories?outlet_id=${currentOutlet.id}`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            } else {
                toast.error('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                display_order: category.display_order,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                display_order: categories.length,
            });
        }
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', display_order: 0 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOutlet) return;

        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory.id}`
                : '/api/categories';

            const method = editingCategory ? 'PATCH' : 'POST';

            const payload = editingCategory
                ? formData
                : { ...formData, outlet_id: currentOutlet.id };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.success(editingCategory ? 'Category updated' : 'Category created');
                handleCloseForm();
                fetchCategories();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Category deleted');
                fetchCategories();
            } else {
                toast.error('Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    if (!currentOutlet) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Please select an outlet</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu Categories</h1>
                    <p className="text-gray-600 mt-1">Manage your menu categories</p>
                </div>
                <Button onClick={() => handleOpenForm()} className="h-10 sm:h-11">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>
                        Organize your menu items into categories
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading categories...</div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Categories Yet
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Create your first category to organize your menu
                            </p>
                            <Button onClick={() => handleOpenForm()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Category
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Description</TableHead>
                                        <TableHead className="hidden md:table-cell">Order</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-gray-600">
                                                {category.description || '-'}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {category.display_order}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenForm(category)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(category.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Form Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Category' : 'Create Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? 'Update category details'
                                : 'Add a new category to organize your menu'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Category Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Appetizers, Main Course"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="display_order">Display Order</Label>
                            <Input
                                id="display_order"
                                type="number"
                                value={formData.display_order}
                                onChange={(e) =>
                                    setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                                }
                                min="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Lower numbers appear first
                            </p>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" className="flex-1">
                                {editingCategory ? 'Update' : 'Create'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseForm}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
