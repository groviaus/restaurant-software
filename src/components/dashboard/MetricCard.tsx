'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
}

export function MetricCard({
    title,
    value,
    subtitle,
    icon,
    comparison,
    href,
    loading,
    className = '',
}: MetricCardProps) {
    const router = useRouter();

    const handleClick = () => {
        if (href) {
            router.push(href);
        }
    };

    const getTrendIcon = () => {
        if (!comparison) return null;
        if (comparison.value > 0) return <TrendingUp className="h-4 w-4" />;
        if (comparison.value < 0) return <TrendingDown className="h-4 w-4" />;
        return <Minus className="h-4 w-4" />;
    };

    const getTrendColor = () => {
        if (!comparison) return '';
        if (comparison.value > 0) return 'text-green-600 dark:text-green-400';
        if (comparison.value < 0) return 'text-red-600 dark:text-red-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const cardContent = (
        <>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {value}
                    </div>
                    {subtitle && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                    {comparison && (
                        <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span>
                                {comparison.value > 0 ? '+' : ''}
                                {comparison.value}% {comparison.label}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </>
    );

    if (href) {
        return (
            <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                    }
                }}
                aria-label={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}${comparison ? `, ${comparison.value > 0 ? 'up' : 'down'} ${Math.abs(comparison.value)}% ${comparison.label}` : ''
                    }. Click to view details.`}
            >
                {cardContent}
            </Card>
        );
    }

    return (
        <Card className={className} aria-label={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}>
            {cardContent}
        </Card>
    );
}
