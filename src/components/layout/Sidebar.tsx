'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Table2,
  LogOut,
  Package,
  FileText,
  Store,
  History,
  Receipt,
  TrendingUp,
  X,
  FolderOpen,
  Users,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, module: 'analytics' },
  { name: 'Categories', href: '/categories', icon: FolderOpen, module: 'menu' },
  { name: 'Menu', href: '/menu', icon: UtensilsCrossed, module: 'menu' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, module: 'orders' },
  { name: 'Order History', href: '/orders/history', icon: History, module: 'orders' },
  { name: 'Bills', href: '/bills', icon: Receipt, module: 'bills' },
  { name: 'Tables', href: '/tables', icon: Table2, module: 'tables' },
  { name: 'Inventory', href: '/inventory', icon: Package, module: 'inventory' },
  { name: 'Reports', href: '/reports', icon: FileText, module: 'reports' },
  { name: 'Outlets', href: '/outlets', icon: Store, module: 'outlets' },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users, module: 'users' },
  { name: 'Roles & Permissions', href: '/roles', icon: Shield, module: 'roles' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const { checkPermission, isAdmin, loading } = usePermissions();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  /* Filter navigation items based on permissions */
  const filteredNavigation = navigation.filter(item => {
    return checkPermission(item.module, 'view');
  });

  const filteredAdminNavigation = adminNavigation.filter(item => {
    return isAdmin || checkPermission(item.module, 'view');
  });

  const fullNavigation = [...filteredNavigation, ...filteredAdminNavigation];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header with close button on mobile */}
        <div className="mt-[1.5rem] flex h-14 sm:h-16 items-center justify-between border-b border-gray-800 px-4">
          <h1 className="text-lg sm:text-xl font-bold truncate">Restaurant POS</h1>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-white hover:bg-gray-800 min-h-[44px] min-w-[44px]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 sm:px-3 py-3 sm:py-4">
          {fullNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white active:bg-gray-700'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out button */}
        <div className="border-t border-gray-800 p-3 sm:p-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="flex w-full items-center justify-start gap-3 text-gray-300 hover:bg-gray-800 hover:text-white min-h-[44px]"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Sign Out</span>
          </Button>
        </div>
      </div>
    </>
  );
}

