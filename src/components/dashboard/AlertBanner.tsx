'use client';

import { useState } from 'react';
import { X, AlertTriangle, Info, AlertCircle, ArrowRight } from 'lucide-react';

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
        bgColor: 'bg-blue-500/5 dark:bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-900 dark:text-blue-200',
        iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        icon: Info,
    },
    warning: {
        bgColor: 'bg-amber-500/5 dark:bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        textColor: 'text-amber-900 dark:text-amber-200',
        iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        icon: AlertTriangle,
    },
    error: {
        bgColor: 'bg-rose-500/5 dark:bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        textColor: 'text-rose-900 dark:text-rose-200',
        iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
        icon: AlertCircle,
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
                        className={`${config.bgColor} ${config.borderColor} border rounded-xl p-3 sm:py-2.5 sm:px-4 flex items-center justify-between gap-3 shadow-xs`}
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
                                <Icon className="h-4 w-4" aria-hidden="true" />
                            </div>
                            <p className={`text-xs sm:text-sm font-medium ${config.textColor} truncate`}>
                                {alert.message}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            {alert.actionLabel && alert.actionHref && (
                                <a
                                    href={alert.actionHref}
                                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all hover:opacity-90 ${config.textColor} border-current/20 bg-background/60 hover:bg-background`}
                                >
                                    <span>{alert.actionLabel}</span>
                                    <ArrowRight className="h-3 w-3" />
                                </a>
                            )}
                            {alert.dismissible !== false && (
                                <button
                                    onClick={() => handleDismiss(alert.id)}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                                    aria-label="Dismiss alert"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

