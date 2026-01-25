import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { conversationId } = await req.json();
    const supabase = createServerSupabaseClient();

    const { data: conversation } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const ctx = conversation.travel_context;

    // ✅ INSERT INTO EXISTING PLANNER TABLE
    await supabase.from("planner_requests").insert({
      source: "chat",              // optional but recommended
      name: ctx.name,
      travellers: ctx.travellers,
      travel_time: ctx.timing,
      route_type: ctx.routePreference,
      duration: ctx.nights,
      golf: ctx.golf === "Yes",
      regions: ctx.regions,
      travel_style: ctx.travelLevel,
      notes: ctx.notes,
      raw_payload: ctx,            // optional full JSON backup
    });

    // ✅ Mark chat as completed
    await supabase
      .from("chat_conversations")
      .update({
        current_step: "submitted",
        status: "completed",
      })
      .eq("id", conversationId);

    // ✅ Assistant confirmation
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: "Thank you! Your trip request has been submitted.",
      step: "submitted",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
