'use client';

import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, Package, UtensilsCrossed, Receipt, Sparkles } from 'lucide-react';
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
    primary?: boolean;
}

export function QuickActionsDesktop() {
    const router = useRouter();

    const actions: QuickAction[] = [
        {
            icon: <Plus className="h-4 w-4" />,
            label: 'New Order',
            href: '/orders',
            primary: true,
        },
        {
            icon: <LayoutGrid className="h-4 w-4 text-muted-foreground" />,
            label: 'Tables',
            href: '/tables',
        },
        {
            icon: <Package className="h-4 w-4 text-muted-foreground" />,
            label: 'Inventory',
            href: '/inventory',
        },
        {
            icon: <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />,
            label: 'Menu',
            href: '/menu',
        },
        {
            icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
            label: 'Bills',
            href: '/bills',
        },
    ];

    const handleAction = (href: string) => {
        router.push(href);
    };

    return (
        <div className="hidden sm:flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md px-3 py-2 shadow-xs">
            {/* Left: Quick Actions Tag */}
            <div className="flex items-center gap-2 pl-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Navigation
                </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={200}>
                    {actions.map((action, index) => (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                {action.primary ? (
                                    <button
                                        onClick={() => handleAction(action.href)}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-gray-800 hover:shadow active:scale-95 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                                        aria-label={action.label}
                                    >
                                        {action.icon}
                                        <span>{action.label}</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAction(action.href)}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 px-2.5 text-xs font-medium text-foreground/80 transition-all hover:border-border hover:bg-muted/80 hover:text-foreground active:scale-95"
                                        aria-label={action.label}
                                    >
                                        {action.icon}
                                        <span>{action.label}</span>
                                    </button>
                                )}
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                <p>Navigate to {action.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
}

