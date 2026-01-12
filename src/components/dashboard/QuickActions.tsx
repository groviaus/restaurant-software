'use client';

import { useRouter } from 'next/navigation';
import { Home, Plus, LayoutGrid, Package, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuickAction {
    icon: React.ReactNode;
    label: string;
    href: string;
    variant?: 'default' | 'outline' | 'secondary';
    primary?: boolean;
}

export function QuickActions() {
    const router = useRouter();

    const actions: QuickAction[] = [
        {
            icon: <Home className="h-5 w-5" />,
            label: 'Dashboard',
            href: '/dashboard',
            variant: 'outline',
        },
        {
            icon: <Plus className="h-5 w-5" />,
            label: 'New Order',
            href: '/orders',
            variant: 'default',
            primary: true,
        },
        {
            icon: <LayoutGrid className="h-5 w-5" />,
            label: 'Tables',
            href: '/tables',
            variant: 'outline',
        },
        {
            icon: <Package className="h-5 w-5" />,
            label: 'Inventory',
            href: '/inventory',
            variant: 'outline',
        },
        {
            icon: <Receipt className="h-5 w-5" />,
            label: 'Bills',
            href: '/bills',
            variant: 'outline',
        },
    ];

    const handleAction = (href: string) => {
        router.push(href);
    };

    return (
        <>
            {/* Desktop: Top sticky bar - HIDDEN when used globally, only shown on Dashboard */}
            <div className="hidden">
                <div className="flex items-center gap-2 p-3 sm:p-4 overflow-x-auto scrollbar-hide">
                    <TooltipProvider delayDuration={300}>
                        {actions.map((action, index) => (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={action.variant}
                                        size="default"
                                        onClick={() => handleAction(action.href)}
                                        className="min-h-[44px] min-w-fit touch-feedback flex-shrink-0"
                                        aria-label={action.label}
                                    >
                                        {action.icon}
                                        <span className="ml-2">{action.label}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>{action.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
            </div>

            {/* Mobile: Floating dock at bottom with glassmorphism */}
            <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md pb-safe">
                <div className="relative">
                    {/* Glassmorphism background */}
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[24px] shadow-2xl border border-gray-200/50 dark:border-gray-700/50" />

                    {/* Content */}
                    <div className="relative flex items-center justify-around gap-1 p-3">
                        <TooltipProvider delayDuration={300}>
                            {actions.map((action, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handleAction(action.href)}
                                            className={`
                        relative flex items-center justify-center
                        ${action.primary
                                                    ? 'w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[18px] shadow-lg'
                                                    : 'w-12 h-12 bg-gray-100/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-[16px]'
                                                }
                        hover:scale-110 active:scale-95
                        transition-all duration-200 ease-out
                        backdrop-blur-sm
                      `}
                                            aria-label={action.label}
                                        >
                                            {action.icon}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="mb-2">
                                        <p>{action.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </>
    );
}
