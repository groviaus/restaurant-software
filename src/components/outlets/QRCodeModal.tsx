'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Copy, QrCode, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from '@/lib/capacitor/download';

interface QRCodeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    outletId: string;
    outletName: string;
}

export function QRCodeModal({ open, onOpenChange, outletId, outletName }: QRCodeModalProps) {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const menuUrl = `${baseUrl}/qr-menu?outlet=${outletId}`;

    useEffect(() => {
        if (open) {
            generateQRCode();
        } else {
            // Clean up blob URL when modal closes
            if (qrCodeUrl) {
                URL.revokeObjectURL(qrCodeUrl);
                setQrCodeUrl('');
            }
        }
    }, [open]);

    const generateQRCode = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/qr/${outletId}`);

            if (!response.ok) {
                throw new Error('Failed to generate QR code');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setQrCodeUrl(url);
        } catch (err: any) {
            setError(err.message || 'Failed to generate QR code');
            toast.error('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadQR = async () => {
        if (qrCodeUrl) {
            try {
                // Fetch the blob from the URL
                const response = await fetch(qrCodeUrl);
                const blob = await response.blob();
                const filename = `qr-menu-${outletName.toLowerCase().replace(/\s+/g, '-')}.png`;
                
                await downloadFile(blob, filename, 'image/png');
            toast.success('QR code downloaded successfully');
            } catch (error: any) {
                toast.error(error.message || 'Failed to download QR code');
            }
        }
    };

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(menuUrl);
            toast.success('Menu URL copied to clipboard');
        } catch (err) {
            toast.error('Failed to copy URL');
        }
    };

    const handleOpenMenu = () => {
        window.open(menuUrl, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        QR Code for {outletName}
                    </DialogTitle>
                    <DialogDescription>
                        Share this QR code with customers to let them view your menu
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* QR Code Display */}
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                <p className="text-sm text-gray-500">Generating QR code...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-red-600 mb-3">{error}</p>
                                <Button onClick={generateQRCode} variant="outline" size="sm">
                                    Try Again
                                </Button>
                            </div>
                        ) : qrCodeUrl ? (
                            <img
                                src={qrCodeUrl}
                                alt="QR Code"
                                className="w-64 h-64 rounded-lg shadow-sm"
                            />
                        ) : null}
                    </div>

                    {/* Menu URL */}
                    <div className="space-y-2">
                        <Label htmlFor="menu-url">Menu URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="menu-url"
                                value={menuUrl}
                                readOnly
                                className="font-mono text-xs"
                            />
                            <Button
                                onClick={handleCopyUrl}
                                variant="outline"
                                size="icon"
                                title="Copy URL"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={handleOpenMenu}
                                variant="outline"
                                size="icon"
                                title="Open menu in new tab"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleDownloadQR}
                            disabled={!qrCodeUrl || loading}
                            className="flex-1"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download QR Code
                        </Button>
                        <Button
                            onClick={() => onOpenChange(false)}
                            variant="outline"
                            className="flex-1"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
