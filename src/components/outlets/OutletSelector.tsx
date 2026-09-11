'use client';

import { useState, useEffect } from 'react';
import { useOutlet } from '@/hooks/useOutlet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Store, Loader2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OutletSelector() {
  const { currentOutletId, outlets, switchOutlet, isAdmin } = useOutlet();
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Outlets are loaded by useOutlet hook, just update loading state
    if (isAdmin) {
      // If outlets are already loaded, set loading to false
      if (outlets.length > 0) {
        setLoading(false);
      } else {
        // Wait a bit for outlets to load, then set loading to false
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
      }
    } else {
      setLoading(false);
    }
  }, [isAdmin, outlets.length]);

  // Don't show for non-admins
  if (!isAdmin) {
    return null;
  }

  const handleSwitch = async (newOutletId: string) => {
    if (newOutletId === currentOutletId || switching) {
      return;
    }

    setSwitching(true);
    try {
      await switchOutlet(newOutletId);
    } catch (error) {
      console.error('Failed to switch outlet:', error);
      // Optionally show toast notification here
    } finally {
      setSwitching(false);
    }
  };

  const currentOutlet = outlets.find((outlet) => outlet.id === currentOutletId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading outlets...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={switching || outlets.length === 0}
            className={cn(
              'flex h-8 sm:h-9 w-[150px] sm:w-[190px] items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/60 px-2.5 text-xs font-medium text-foreground shadow-2xs transition-all hover:bg-muted/80 hover:border-border active:scale-95 focus-visible:ring-1 focus-visible:ring-ring cursor-pointer',
              switching && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Select outlet"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary flex-shrink-0">
                <Store className="h-3 w-3" />
              </div>
              <span className="truncate text-left">
                {currentOutlet ? (
                  currentOutlet.name
                ) : (
                  <span className="text-muted-foreground">Select outlet</span>
                )}
              </span>
            </div>
            {switching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          sideOffset={6}
          align="end"
          className="w-[180px] sm:w-[200px] rounded-xl border border-border/60 bg-popover/95 p-1.5 shadow-lg backdrop-blur-md"
        >
          {outlets.length === 0 ? (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground py-2">
              No outlets available
            </DropdownMenuItem>
          ) : (
            outlets.map((outlet) => (
              <DropdownMenuItem
                key={outlet.id}
                onClick={() => handleSwitch(outlet.id)}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer"
              >
                <span className="truncate">{outlet.name}</span>
                {outlet.id === currentOutletId && (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ml-2 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
