import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  try {
    const { outletId } = await params;

    // Validate outlet exists
    const supabase = createServiceRoleClient();
    const { data: outlet, error: outletError } = await supabase
      .from('outlets')
      .select('id, name')
      .eq('id', outletId)
      .single();

    if (outletError || !outlet) {
      return NextResponse.json(
        { error: 'Outlet not found' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const menuUrl = `${baseUrl}/qr-menu?outlet=${outletId}`;

    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    // Convert data URL to buffer
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qr-menu-${outlet.name.toLowerCase().replace(/\s+/g, '-')}.png"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error: any) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
