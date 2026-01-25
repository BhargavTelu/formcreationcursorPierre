import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: conversation, error } = await supabase
      .from("chat_conversations")
      .insert({ current_step: "name" })
      .select()
      .single();

    if (error || !conversation) {
      console.error("Conversation insert failed", error);
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    await supabase.from("chat_messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content:
        "Welcome! I'm excited to help you plan your dream African adventure. What's your name?",
      step: "name",
    });

    return NextResponse.json({
      conversationId: conversation.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
