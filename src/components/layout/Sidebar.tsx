'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Settings,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/usePermissions';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  module: string;
  badge?: string;
  shortcut?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard', shortcut: 'G D' },
      { name: 'Orders', href: '/orders', icon: ShoppingCart, module: 'orders', shortcut: 'G O' },
      { name: 'Order History', href: '/orders/history', icon: History, module: 'orders' },
      { name: 'Tables & Floor', href: '/tables', icon: Table2, module: 'tables', shortcut: 'G T' },
      { name: 'Bills & Receipts', href: '/bills', icon: Receipt, module: 'bills' },
    ],
  },
  {
    title: 'Menu & Stock',
    items: [
      { name: 'Categories', href: '/categories', icon: FolderOpen, module: 'menu' },
      { name: 'Menu Items', href: '/menu', icon: UtensilsCrossed, module: 'menu', shortcut: 'G M' },
      { name: 'Inventory', href: '/inventory', icon: Package, module: 'inventory', shortcut: 'G I' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { name: 'Analytics', href: '/analytics', icon: TrendingUp, module: 'analytics', shortcut: 'G A' },
      { name: 'Reports', href: '/reports', icon: FileText, module: 'reports' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Outlets', href: '/outlets', icon: Store, module: 'outlets' },
      { name: 'Users & Staff', href: '/users', icon: Users, module: 'users' },
      { name: 'Roles & Access', href: '/roles', icon: Shield, module: 'roles' },
      { name: 'Settings', href: '/settings', icon: Settings, module: 'settings', shortcut: 'G S' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const { checkPermission, isAdmin } = usePermissions();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resto_sidebar_collapsed');
        if (saved !== null) {
          return saved === 'true';
        }
      } catch {
        // ignore
      }
    }
    return false;
  });
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('resto_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut listener: Cmd+B or Ctrl+B to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for custom event from Header or other components
  useEffect(() => {
    const handleCustomToggle = () => toggleCollapse();
    window.addEventListener('toggle-sidebar-collapse', handleCustomToggle);
    return () => window.removeEventListener('toggle-sidebar-collapse', handleCustomToggle);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleLinkClick = (href: string) => {
    if (onClose) {
      onClose();
    }
    if (href !== pathname) {
      setNavigatingTo(href);
      router.push(href);
      setTimeout(() => setNavigatingTo(null), 1000);
    }
  };

  const handleLinkHover = (href: string) => {
    if (href !== pathname) {
      router.prefetch(href);
    }
  };

  // Filter sections and items based on user permissions
  const filteredSections = useMemo(() => {
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.module === 'users' || item.module === 'roles' || item.module === 'settings') {
            return isAdmin || checkPermission(item.module, 'view');
          }
          return checkPermission(item.module, 'view');
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [checkPermission, isAdmin]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[99] flex h-screen flex-col bg-slate-950 text-slate-200 border-r border-slate-800/80 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 select-none shadow-2xl lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-[68px]' : 'lg:w-64',
          'w-64'
        )}
      >
        {/* Top Brand Header */}
        {isCollapsed ? (
          <div className="flex h-14 sm:h-16 items-center justify-center border-b border-slate-800/80 bg-slate-950/90 px-2 transition-all duration-300 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 hover:scale-105 transition-transform"
                  aria-label="Restaurant POS Dashboard"
                >
                  <UtensilsCrossed className="h-4.5 w-4.5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="bg-slate-900 text-slate-100 border border-slate-700">
                <span>Restaurant POS</span>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-3.5 transition-all duration-300 flex-shrink-0">
            {/* Logo & Brand Name */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 min-w-0 group cursor-pointer focus:outline-none"
            >
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <UtensilsCrossed className="h-4.5 w-4.5" />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors truncate">
                    Restaurant POS
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  Multi-Outlet Suite
                </span>
              </div>
            </Link>

            {/* Desktop Collapse Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Collapse sidebar (Cmd+B)"
              title="Collapse sidebar (Cmd+B)"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>

            {/* Mobile Close Button */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 min-h-[40px] min-w-[40px]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-2.5 space-y-4 custom-scrollbar">
          {filteredSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              <div
                className={cn(
                  'px-2 pt-1 pb-1 transition-all duration-200',
                  isCollapsed ? 'lg:hidden' : 'block'
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                  {section.title}
                </p>
              </div>

              {/* Collapsed Section Divider */}
              {isCollapsed && (
                <div className="hidden lg:block my-2 mx-auto w-5 border-t border-slate-800/80" />
              )}

              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));
                  const isNavigating = navigatingTo === item.href;
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(item.href);
                      }}
                      onMouseEnter={() => handleLinkHover(item.href)}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer min-h-[40px]',
                        isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-start',
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-600/5 text-white font-semibold shadow-xs border border-indigo-500/30'
                          : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-100 active:bg-slate-800/60',
                        isNavigating && 'opacity-70 cursor-wait'
                      )}
                    >
                      {/* Active Left Glow Accent Bar in Expanded Mode */}
                      {isActive && !isCollapsed && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                      )}

                      {/* Icon */}
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg transition-colors flex-shrink-0',
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Label in Expanded Mode */}
                      <span
                        className={cn(
                          'truncate transition-opacity duration-200',
                          isCollapsed ? 'lg:hidden' : 'block'
                        )}
                      >
                        {item.name}
                      </span>

                      {/* Loading or Active Dot */}
                      {isNavigating ? (
                        <Loader2 className={cn('h-3.5 w-3.5 animate-spin text-indigo-400 ml-auto flex-shrink-0', isCollapsed && 'lg:hidden')} />
                      ) : isActive && !isCollapsed ? (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-xs shadow-indigo-400/80" />
                      ) : null}
                    </Link>
                  );

                  // If collapsed on desktop, wrap item in Tooltip
                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={12}
                          className="hidden lg:flex items-center gap-2 bg-slate-900 text-slate-100 border border-slate-700/80 px-2.5 py-1.5 shadow-xl rounded-lg text-xs"
                        >
                          <span className="font-semibold">{item.name}</span>
                          {item.shortcut && (
                            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {item.shortcut}
                            </kbd>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.name}>{linkContent}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Sidebar Footer */}
        <div className="border-t border-slate-800/80 p-2 sm:p-2.5 bg-slate-950/60 flex-shrink-0 space-y-1">
          {isCollapsed ? (
            <>
              {/* Expand Toggle Button in Collapsed Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleCollapse}
                    className="w-full flex h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
                    aria-label="Expand sidebar (Cmd+B)"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="bg-slate-900 text-slate-100 border border-slate-700">
                  <span>Expand sidebar (⌘B)</span>
                </TooltipContent>
              </Tooltip>

              {/* Sign Out Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex h-9 items-center justify-center rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    aria-label="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="bg-slate-900 text-rose-400 border border-slate-700">
                  <span>Sign Out</span>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              {/* User Quick Info Pill (Expanded Mode) */}
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/60 transition-all">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-[10px]">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-slate-950" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {profile?.name?.split(' ')[0] || 'Staff'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate uppercase font-medium">
                      {profile?.role || 'User'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-1.5 py-1 rounded hover:bg-slate-800 transition-colors"
                  title="Collapse sidebar (Cmd+B)"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Sign Out Button */}
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex w-full items-center justify-start gap-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 min-h-[38px] px-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 flex-shrink-0 text-rose-400" />
                <span className="truncate">Sign Out</span>
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
