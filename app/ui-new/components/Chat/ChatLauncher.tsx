"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatPanel from "./ChatPanel";

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-stone-900 px-4 py-3 text-white shadow-lg hover:bg-stone-800"
      >
        <MessageCircle size={18} />
        <span className="text-sm font-medium">Chat with Expert</span>
      </button>

      {/* Chat panel */}
      <ChatPanel isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
