'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile } = useAuth();

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-white px-3 sm:px-4 lg:px-6">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        {/* Mobile menu button */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden flex-shrink-0 min-h-[44px] min-w-[44px]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {profile?.name || 'User'}
          </h2>
          {profile && (
            <span className="hidden xs:inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 flex-shrink-0">
              {profile.role}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Show role badge on mobile if hidden in title area */}
        {profile && (
          <span className="xs:hidden inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            {profile.role}
          </span>
        )}
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
          <AvatarFallback className="text-xs sm:text-sm">
            {profile?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

