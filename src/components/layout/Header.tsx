'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const { profile } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {profile?.name || 'User'}
        </h2>
        {profile && (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            {profile.role}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>
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

