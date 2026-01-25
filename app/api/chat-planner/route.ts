import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { conversationId, message } = await req.json();
    const supabase = createServerSupabaseClient();

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      );
    }

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

    const ctx = conversation.travel_context || {};
    let nextStep = conversation.current_step;
    let reply = "";
    let options: string[] | null = null;

    /* ---------------- SAVE USER INPUT ---------------- */
    switch (conversation.current_step) {
      case "name":
        ctx.name = message;
        break;
      case "travellers":
        ctx.travellers = message;
        break;
      case "timing":
        ctx.timing = message;
        break;
      case "route_preference":
        ctx.routePreference = message;
        break;
      case "nights":
        ctx.nights = message;
        break;
      case "golf":
        ctx.golf = message;
        break;
      case "golf_rounds":
        ctx.golfRounds = message;
        break;
      case "region":
        ctx.regions = ctx.regions || [];
        if (message !== "Done" && !ctx.regions.includes(message)) {
          ctx.regions.push(message);
        }
        break;
      case "travel_level":
        ctx.travelLevel = message;
        break;
      case "notes":
        ctx.notes = message;
        break;
    }

    /* ---------------- FLOW ---------------- */
    switch (conversation.current_step) {
      case "name":
        nextStep = "travellers";
        reply = `Nice to meet you, ${message}! How many travellers will be joining?`;
        options = ["1", "2", "3", "4", "5+"];
        break;

      case "travellers":
        nextStep = "timing";
        reply = "When would you like to travel?";
        options = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec", "Flexible"];
        break;

      case "timing":
        nextStep = "route_preference";
        reply = "Would you like a pre-defined route or a custom trip?";
        options = ["Pre-defined route", "Custom trip"];
        break;

      case "route_preference":
        nextStep = "nights";
        reply = "How long should the trip be?";
        options = ["1 week", "10–14 nights", "3 weeks", "Not sure"];
        break;

      case "nights":
        nextStep = "golf";
        reply = "Is this a golf trip?";
        options = ["Yes", "No"];
        break;

      case "golf":
        if (message === "Yes") {
          nextStep = "golf_rounds";
          reply = "How many rounds of golf?";
        } else {
          nextStep = "region";
          reply = "Which regions would you like to explore? (Select multiple, then Done)";
          const { data } = await supabase
            .from("destinations")
            .select("name")
            .eq("type", "region")
            .is("parent_id", null);
          options = [...(data?.map((r) => r.name) || []), "Done"];
        }
        break;

      case "golf_rounds":
        nextStep = "region";
        reply = "Which regions would you like to explore? (Select multiple, then Done)";
        const { data } = await supabase
          .from("destinations")
          .select("name")
          .eq("type", "region")
          .is("parent_id", null);
        options = [...(data?.map((r) => r.name) || []), "Done"];
        break;

    case "region": {
  // Message comes as: "Cape Town, Garden Route, Kwazulu-Natal"
  ctx.regions = message
    .split(",")
    .map((r: string) => r.trim())
    .filter(Boolean);

  nextStep = "travel_level";
  reply = "How would you describe your travel style?";
  options = ["Relaxed", "Balanced", "Active"];
  break;
}


      case "travel_level":
        nextStep = "notes";
        reply = "Any special requests or notes?";
        break;

      /* ---------------- REAL SUMMARY ---------------- */
      case "notes": {
        nextStep = "summary";

        const summary = `
👤 Name: ${ctx.name}
👥 Travellers: ${ctx.travellers}
🗓 Travel Time: ${ctx.timing}
🧭 Trip Type: ${ctx.routePreference}
⏱ Duration: ${ctx.nights}
🏌️ Golf Trip: ${ctx.golf}
🌍 Regions: ${(ctx.regions || []).join(", ")}
🎯 Travel Style: ${ctx.travelLevel}

📝 Notes:
${ctx.notes || "None"}
        `.trim();

        reply = `Here’s a summary of your trip 👇\n\n${summary}\n\nPlease review and submit.`;
        break;
      }
    }

    /* ---------------- SAVE ASSISTANT MESSAGE ---------------- */
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: reply,
      options,
      step: nextStep, // ⭐ THIS IS CRITICAL
    });

    await supabase
      .from("chat_conversations")
      .update({
        current_step: nextStep,
        travel_context: ctx,
      })
      .eq("id", conversationId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
