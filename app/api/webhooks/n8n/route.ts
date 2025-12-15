import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const payloadSchema = z
  .object({
    routePreference: z.enum(['predefined', 'trip-design']),
  })
  .passthrough();

function webhookUrlForRoutePreference(routePreference: 'predefined' | 'trip-design'): string | null {
  if (routePreference === 'predefined') {
    return process.env.N8N_WEBHOOK_PREDEFINED_URL || null;
  }
  return process.env.N8N_WEBHOOK_TRIP_DESIGN_URL || null;
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);

    const webhookUrl = webhookUrlForRoutePreference(payload.routePreference);
    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook is not configured for this route type.',
        },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          error: 'Upstream webhook request failed.',
          status: upstream.status,
          details: text ? text.slice(0, 2000) : undefined,
        },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Some webhooks return empty/non-JSON bodies; don’t fail on parse.
    const body = await upstream.json().catch(() => null);

    return NextResponse.json(
      {
        success: true,
        status: upstream.status,
        data: body,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Invalid payload.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    console.error('[Webhook] Unexpected error forwarding webhook', error);
    return NextResponse.json(
      { success: false, error: 'Failed to forward webhook.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

