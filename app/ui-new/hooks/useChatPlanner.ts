"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useChatPlanner() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = async (id: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at");

    if (data) setMessages(data);
  };

  const startChat = async () => {
    setLoading(true);

    // ✅ Reload messages if conversation already exists
    if (conversationId) {
      await loadMessages(conversationId);
      setLoading(false);
      return;
    }

    // ✅ Create new conversation
    const { data } = await supabase
      .from("chat_conversations")
      .insert({ current_step: "name" })
      .select()
      .single();

    setConversationId(data.id);

    // ✅ Insert FIRST assistant message
    await supabase.from("chat_messages").insert({
      conversation_id: data.id,
      role: "assistant",
      content:
        "Welcome! I'm excited to help you plan your dream African adventure. What's your name?",
      step: "name",
    });

    await loadMessages(data.id);
    setLoading(false);
  };

  const sendMessage = async (text: string) => {
    if (!conversationId || !text.trim()) return;

    setLoading(true);

    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: text,
    });

    await fetch("/api/chat-planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, message: text }),
    });

    await loadMessages(conversationId);
    setLoading(false);
  };

  const submitTripOptimistic = async () => {
    if (!conversationId) return;

    // ⚡ Optimistic assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: "optimistic-submit",
        role: "assistant",
        content: "Thank you! Your trip request has been submitted.",
        step: "submitted",
      },
    ]);

    // Fire & forget backend submit
    fetch("/api/chat-planner/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    }).catch(console.error);
  };

  return {
    messages,
    loading,
    startChat,
    sendMessage,
    submitTripOptimistic,
  };
}
