import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RoutePreference = "predefined" | "trip-design";

function routePreferenceFromBody(body: any): RoutePreference | null {
  // Prefer explicit routePreference if caller provides it.
  if (body?.routePreference === "predefined" || body?.routePreference === "trip-design") {
    return body.routePreference;
  }

  // Map UI TripData `journeyType` to backend webhook route preference.
  // UI: "pre-defined" | "custom" | ""
  if (body?.journeyType === "pre-defined") return "predefined";
  if (body?.journeyType === "custom") return "trip-design";

  return null;
}

function webhookUrlForRoutePreference(routePreference: RoutePreference): string | null {
  if (routePreference === "predefined") {
    return process.env.N8N_WEBHOOK_PREDEFINED_URL || null;
  }
  return process.env.N8N_WEBHOOK_TRIP_DESIGN_URL || null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { error } = await supabase
      .from("trip_requests")
      .insert([{ data: body }]);

    if (error) {
      console.error(error);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    // Forward to n8n webhook (if configured) so workflows trigger.
    const routePreference = routePreferenceFromBody(body);
    if (!routePreference) {
      return NextResponse.json(
        { success: true, forwarded: false, error: "Missing route preference (journeyType/routePreference)." },
        { status: 200 }
      );
    }

    const webhookUrl = webhookUrlForRoutePreference(routePreference);
    if (!webhookUrl) {
      return NextResponse.json(
        { success: true, forwarded: false, error: "n8n webhook URL is not configured." },
        { status: 200 }
      );
    }

    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("[trip-request] n8n webhook forwarding failed", upstream.status, text);
      return NextResponse.json(
        {
          success: true,
          forwarded: false,
          upstreamStatus: upstream.status,
          upstreamBody: text ? text.slice(0, 2000) : undefined,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, forwarded: true, upstreamStatus: upstream.status });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
