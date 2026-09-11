'use client';

import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type MetricAccent = 'emerald' | 'blue' | 'amber' | 'violet' | 'rose' | 'slate';

export interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    comparison?: {
        value: number;
        label: string;
    };
    href?: string;
    loading?: boolean;
    className?: string;
    accentColor?: MetricAccent;
}

const accentStyles: Record<MetricAccent, { iconBg: string; borderHover: string; glow: string }> = {
    emerald: {
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        borderHover: 'hover:border-emerald-500/30',
        glow: 'from-emerald-500/5',
    },
    blue: {
        iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        borderHover: 'hover:border-blue-500/30',
        glow: 'from-blue-500/5',
    },
    amber: {
        iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        borderHover: 'hover:border-amber-500/30',
        glow: 'from-amber-500/5',
    },
    violet: {
        iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        borderHover: 'hover:border-violet-500/30',
        glow: 'from-violet-500/5',
    },
    rose: {
        iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        borderHover: 'hover:border-rose-500/30',
        glow: 'from-rose-500/5',
    },
    slate: {
        iconBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        borderHover: 'hover:border-slate-500/30',
        glow: 'from-slate-500/5',
    },
};

export function MetricCard({
    title,
    value,
    subtitle,
    icon,
    comparison,
    href,
    loading,
    className = '',
    accentColor,
}: MetricCardProps) {
    const router = useRouter();

    // Auto-detect accent color if not explicitly passed
    const resolvedAccent: MetricAccent = accentColor || (() => {
        const lower = title.toLowerCase();
        if (lower.includes('sales') || lower.includes('revenue')) return 'emerald';
        if (lower.includes('order')) return 'blue';
        if (lower.includes('item') || lower.includes('top')) return 'amber';
        if (lower.includes('inventory')) return 'violet';
        if (lower.includes('alert') || lower.includes('stock')) return 'rose';
        return 'slate';
    })();

    const style = accentStyles[resolvedAccent];

    const handleClick = () => {
        if (href) {
            router.push(href);
        }
    };

    const getTrendBadge = () => {
        if (!comparison) return null;
        const isPositive = comparison.value > 0;
        const isNeutral = comparison.value === 0;

        return (
            <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border ${
                    isPositive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : isNeutral
                        ? 'bg-muted text-muted-foreground border-border'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
            >
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {!isPositive && !isNeutral && <TrendingDown className="h-3 w-3" />}
                {isNeutral && <Minus className="h-3 w-3" />}
                <span>
                    {isPositive ? '+' : ''}
                    {comparison.value}% {comparison.label}
                </span>
            </span>
        );
    };

    if (loading) {
        return (
            <div className={`relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 sm:p-5 shadow-xs ${className}`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="h-3.5 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                </div>
                <div className="space-y-2">
                    <div className="h-7 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-36 bg-muted/60 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    const content = (
        <div
            className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 ${
                href ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-border active:translate-y-0' : ''
            } ${style.borderHover} ${className}`}
            onClick={href ? handleClick : undefined}
            role={href ? 'button' : undefined}
            tabIndex={href ? 0 : undefined}
            onKeyDown={
                href
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleClick();
                          }
                      }
                    : undefined
            }
            aria-label={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}
        >
            {/* Subtle top glow highlight */}
            <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.glow} to-transparent opacity-80`}
            />

            {/* Card Header: Title + Icon */}
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-muted-foreground/80 truncate">
                    {title}
                </span>
                <div className="flex items-center gap-1.5">
                    {icon && (
                        <div
                            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg border flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${style.iconBg}`}
                        >
                            {icon}
                        </div>
                    )}
                    {href && (
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                    )}
                </div>
            </div>

            {/* Card Body: Metric Value + Subtitle/Trend */}
            <div className="space-y-1 sm:space-y-1.5">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground font-mono tabular-nums truncate">
                    {value}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {subtitle && (
                        <p className="text-xs text-muted-foreground truncate max-w-full">
                            {subtitle}
                        </p>
                    )}
                    {comparison && getTrendBadge()}
                </div>
            </div>
        </div>
    );

    return content;
}
