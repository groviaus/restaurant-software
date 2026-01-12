'use client';

import { useState } from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AlertSeverity = 'info' | 'warning' | 'error';

export interface Alert {
    id: string;
    message: string;
    severity: AlertSeverity;
    actionLabel?: string;
    actionHref?: string;
    dismissible?: boolean;
}

interface AlertBannerProps {
    alerts: Alert[];
    onDismiss?: (alertId: string) => void;
}

const severityConfig = {
    info: {
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-900 dark:text-blue-100',
        icon: Info,
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    warning: {
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        borderColor: 'border-orange-200 dark:border-orange-800',
        textColor: 'text-orange-900 dark:text-orange-100',
        icon: AlertTriangle,
        iconColor: 'text-orange-600 dark:text-orange-400',
    },
    error: {
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-900 dark:text-red-100',
        icon: AlertCircle,
        iconColor: 'text-red-600 dark:text-red-400',
    },
};

export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));

    if (visibleAlerts.length === 0) {
        return null;
    }

    const handleDismiss = (alertId: string) => {
        setDismissedAlerts((prev) => new Set([...prev, alertId]));
        onDismiss?.(alertId);
    };

    return (
        <div className="space-y-2" role="alert" aria-live="polite" aria-atomic="true">
            {visibleAlerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;

                return (
                    <div
                        key={alert.id}
                        className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 sm:p-4 flex items-start gap-3`}
                    >
                        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm sm:text-base font-medium ${config.textColor}`}>
                                {alert.message}
                            </p>
                            {alert.actionLabel && alert.actionHref && (
                                <a
                                    href={alert.actionHref}
                                    className={`text-sm font-semibold underline mt-1 inline-block ${config.textColor} hover:opacity-80`}
                                >
                                    {alert.actionLabel} →
                                </a>
                            )}
                        </div>
                        {alert.dismissible !== false && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(alert.id)}
                                className={`flex-shrink-0 h-8 w-8 p-0 ${config.textColor} hover:bg-black/5 dark:hover:bg-white/5`}
                                aria-label="Dismiss alert"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
