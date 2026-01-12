'use client';

import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, Package, Menu, Receipt } from 'lucide-react';
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

export function QuickActionsDesktop() {
    const router = useRouter();

    const actions: QuickAction[] = [
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
            icon: <Menu className="h-5 w-5" />,
            label: 'Menu',
            href: '/menu',
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
        <div className="hidden rounded-md sm:block w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
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
    );
}
