'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Menu,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  Sparkles,
  Search,
  Maximize2,
  Minimize2,
  Store,
  ShoppingCart,
  UtensilsCrossed,
  Table2,
  Package,
  FileText,
  TrendingUp,
  Receipt,
  Users,
  Shield,
  FolderOpen,
  Command,
  LayoutDashboard,
  History,
  ArrowRight,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react';
import { OutletSelector } from '@/components/outlets/OutletSelector';

interface HeaderProps {
  onMenuClick?: () => void;
}

interface RouteItem {
  name: string;
  href: string;
  icon: LucideIcon;
  category: 'Overview' | 'Operations' | 'Catalog' | 'Stock' | 'Finance' | 'Insights' | 'Management' | 'System';
  shortcut?: string;
}

const ALL_ROUTES: RouteItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Overview', shortcut: 'G D' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, category: 'Operations', shortcut: 'G O' },
  { name: 'Order History', href: '/orders/history', icon: History, category: 'Operations' },
  { name: 'Tables & Floor', href: '/tables', icon: Table2, category: 'Operations', shortcut: 'G T' },
  { name: 'Menu & Items', href: '/menu', icon: UtensilsCrossed, category: 'Catalog', shortcut: 'G M' },
  { name: 'Categories', href: '/categories', icon: FolderOpen, category: 'Catalog' },
  { name: 'Inventory & Stock', href: '/inventory', icon: Package, category: 'Stock', shortcut: 'G I' },
  { name: 'Bills & Invoices', href: '/bills', icon: Receipt, category: 'Finance', shortcut: 'G B' },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, category: 'Insights', shortcut: 'G A' },
  { name: 'Reports', href: '/reports', icon: FileText, category: 'Insights' },
  { name: 'Outlets', href: '/outlets', icon: Store, category: 'Management' },
  { name: 'Users & Staff', href: '/users', icon: Users, category: 'Management' },
  { name: 'Roles & Permissions', href: '/roles', icon: Shield, category: 'Management' },
  { name: 'Settings', href: '/settings', icon: Settings, category: 'System', shortcut: 'G S' },
];

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut listener for Command/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Determine active route for breadcrumb display
  const activeRoute = useMemo(() => {
    const directMatch = ALL_ROUTES.find((r) => r.href === pathname);
    if (directMatch) return directMatch;
    // Prefix match
    const prefixMatch = ALL_ROUTES.filter((r) => r.href !== '/dashboard' && pathname?.startsWith(r.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (prefixMatch) return prefixMatch;

    return {
      name: pathname ? pathname.replace(/^\//, '').replace(/-/g, ' ') : 'Dashboard',
      href: pathname || '/dashboard',
      icon: LayoutDashboard,
      category: 'Overview' as const,
    };
  }, [pathname]);

  // Filter routes in search dialog
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return ALL_ROUTES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_ROUTES.filter(
      (item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleNavigate = (href: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(href);
  };

  const ActiveIcon = activeRoute.icon;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border/50 bg-background/80 px-3 sm:px-4 lg:px-6 backdrop-blur-xl safe-area-top transition-colors">
        {/* Left Section: Mobile Menu Trigger + Route Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden flex-shrink-0 h-8.5 w-8.5 rounded-lg border border-border/60 bg-card/60 text-foreground/80 hover:bg-muted/80 hover:text-foreground active:scale-95 transition-transform"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          {/* Desktop Sidebar Collapse Toggle Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar-collapse'))}
            className="hidden lg:flex flex-shrink-0 h-8.5 w-8.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle sidebar (Cmd+B)"
            title="Toggle sidebar (Cmd+B)"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          {/* Route Breadcrumb Pill */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0 shadow-2xs">
              <ActiveIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <span className="hidden md:inline-block text-xs font-medium text-muted-foreground/80 hover:text-muted-foreground transition-colors">
                RestoPOS
              </span>
              <ChevronRight className="hidden md:inline-block h-3 w-3 text-muted-foreground/40" />
              <span className="text-xs sm:text-sm font-bold text-foreground tracking-tight capitalize truncate max-w-[120px] sm:max-w-[200px]">
                {activeRoute.name}
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Quick Search Command Bar */}
        <div className="flex items-center justify-center px-2">
          {/* Desktop / Tablet Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2.5 h-8.5 w-48 md:w-56 lg:w-64 rounded-full border border-border/60 bg-card/50 hover:bg-muted/60 hover:border-border px-3 text-xs text-muted-foreground transition-all cursor-pointer shadow-2xs group"
            aria-label="Search routes and commands"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground/80 group-hover:text-foreground transition-colors" />
            <span className="truncate text-muted-foreground/90 font-normal">Search pages, actions...</span>
            <kbd className="ml-auto pointer-events-none hidden md:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/80 bg-background/90 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/90">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search Icon Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right Section: POS Live Status + Outlet Selector + Fullscreen + User Account */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* POS Terminal Live Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-xs font-medium shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-[11px] tracking-wide">POS Live</span>
          </div>

          {/* Outlet Selector Dropdown */}
          <OutletSelector />

          {/* Fullscreen Toggle for POS Tablets */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex h-8.5 w-8.5 rounded-lg border border-border/50 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Unified User Account Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 p-1 sm:px-2.5 sm:py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted/80 hover:border-border active:scale-95 focus-visible:ring-1 focus-visible:ring-ring cursor-pointer shadow-2xs"
                aria-label="User account menu"
              >
                {/* Avatar with Online Presence Dot */}
                <div className="relative flex-shrink-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-gray-900 to-gray-700 text-white dark:from-white dark:to-gray-200 dark:text-gray-950 font-bold text-xs shadow-xs border border-white/10">
                    {getInitials(profile?.name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>

                {/* User Info Label */}
                <div className="hidden md:flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate max-w-[90px] lg:max-w-[120px]">
                      {profile?.name || 'Staff User'}
                    </span>
                    {profile?.role && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {profile.role}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/70" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-60 rounded-2xl border-0 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10"
            >
              <DropdownMenuLabel className="p-2.5 font-normal">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 text-white dark:from-white dark:to-gray-200 dark:text-gray-950 font-bold text-sm shadow-xs border border-white/10 flex-shrink-0">
                    {getInitials(profile?.name)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-semibold text-foreground tracking-tight truncate">
                      {profile?.name || 'Authenticated Staff'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {profile?.email || 'user@pos.local'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {profile?.role || 'Staff'} • Online
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1 border-border/50" />

              <DropdownMenuItem
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer text-foreground hover:bg-muted/80"
              >
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Dashboard</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push('/orders')}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer text-foreground hover:bg-muted/80"
              >
                <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Active Orders</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push('/tables')}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer text-foreground hover:bg-muted/80"
              >
                <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Tables & Floor</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer text-foreground hover:bg-muted/80"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>System Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer text-foreground hover:bg-muted/80"
              >
                <div className="flex items-center gap-2.5">
                  <Command className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Quick Search</span>
                </div>
                <kbd className="pointer-events-none h-4 select-none items-center gap-0.5 rounded border border-border/80 bg-muted/60 px-1 font-mono text-[9px] text-muted-foreground">
                  ⌘K
                </kbd>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-border/50" />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 cursor-pointer focus:text-rose-600 focus:bg-rose-500/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Search & Quick Navigation Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Navigation</DialogTitle>
          </DialogHeader>

          {/* Search Input Bar */}
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 bg-muted/20">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a page or command (e.g. Orders, Menu, Tables)..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-muted-foreground hover:text-foreground px-1 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filtered Route List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredRoutes.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching pages found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredRoutes.map((route) => {
                const RouteIcon = route.icon;
                const isCurrent = pathname === route.href;
                return (
                  <button
                    key={route.href}
                    type="button"
                    onClick={() => handleNavigate(route.href)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all hover:bg-muted/80 active:scale-[0.99] cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
                        <RouteIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {route.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {route.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Current
                        </span>
                      )}
                      {route.shortcut && (
                        <kbd className="hidden sm:inline-flex text-[10px] font-mono text-muted-foreground/80 bg-muted/60 border border-border/80 px-1.5 py-0.5 rounded">
                          {route.shortcut}
                        </kbd>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Modal Footer Info */}
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Press</span>
              <kbd className="font-mono text-[10px] border border-border bg-background px-1.5 py-0.2 rounded">Esc</kbd>
              <span>to close</span>
            </div>
            <span>{filteredRoutes.length} results</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
