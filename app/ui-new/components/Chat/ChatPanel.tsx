"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  FileDown,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { useChatPlanner } from "../../hooks/useChatPlanner";

export default function ChatPanel({ isOpen, onClose }: any) {
  const {
    messages,
    loading,
    startChat,
    sendMessage,
    submitTripOptimistic,
  } = useChatPlanner();

  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ⭐ Region selection state
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) startChat();
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const lastMessage = messages[messages.length - 1];
  const step = lastMessage?.step;
  const isSummary = step === "summary";
  const isSubmitted = step === "submitted";
  const isRegionStep = step === "region";

  const handleSend = async () => {
    if (!input.trim() || loading || isSummary || isSubmitted) return;
    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  };

  const handleSubmitRegions = async () => {
    if (selectedRegions.length === 0) return;

    const payload = selectedRegions.join(", ");
    setSelectedRegions([]);
    await sendMessage(payload);
  };

  const handleSubmit = () => {
    if (submitting || isSubmitted) return;

    setSubmitting(true);
    submitTripOptimistic();

    setToast("Trip request submitted successfully!");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* PANEL */}
      <div
        className="fixed bottom-2 right-4 z-50 w-[360px] max-h-[520px]
        rounded-2xl overflow-hidden shadow-2xl bg-[#faf7f2]
        flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-[#8b5a3c] px-4 py-3 text-white flex justify-between">
          <div>
            <p className="font-medium">Chat with Expert</p>
            <p className="text-xs text-white/80">
              We typically reply in minutes
            </p>
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m: any) => (
            <div key={m.id}>
              <div
                className={`max-w-[85%] px-4 py-3 text-sm rounded-2xl ${
                  m.role === "user"
                    ? "ml-auto bg-[#8b5a3c] text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                {m.content}

                {/* ⭐ REGION CHECKBOXES */}
                {m.role === "assistant" &&
                  m.step === "region" &&
                  Array.isArray(m.options) && (
                    <div className="mt-3 space-y-2">
                      {m.options
                        .filter((o: string) => o !== "Done")
                        .map((region: string) => (
                          <label
                            key={region}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedRegions.includes(region)}
                              onChange={(e) => {
                                setSelectedRegions((prev) =>
                                  e.target.checked
                                    ? [...prev, region]
                                    : prev.filter((r) => r !== region)
                                );
                              }}
                            />
                            {region}
                          </label>
                        ))}

                      <button
                        onClick={handleSubmitRegions}
                        disabled={selectedRegions.length === 0}
                        className="mt-3 w-full rounded-full py-2 text-sm
                        bg-[#8b5a3c] text-white
                        disabled:opacity-50"
                      >
                        Done
                      </button>
                    </div>
                  )}

                {/* NORMAL OPTIONS (non-region) */}
                {m.role === "assistant" &&
                  m.step !== "region" &&
                  Array.isArray(m.options) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.options.map((opt: string) => (
                        <button
                          key={opt}
                          onClick={() => sendMessage(opt)}
                          disabled={loading || isSummary || isSubmitted}
                          className="rounded-full border border-[#d8cfc4]
                          bg-white px-3 py-1 text-xs
                          hover:bg-[#8b5a3c] hover:text-white
                          disabled:opacity-50 transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                {/* SUBMIT BUTTON */}
                {m.role === "assistant" && m.step === "summary" && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="mt-3 w-full rounded-full py-2 text-sm
                    bg-[#8b5a3c] text-white disabled:opacity-60"
                  >
                    <CheckCircle size={16} className="inline mr-2" />
                    Submit Trip Request
                  </button>
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* FOOTER */}
        <div className="border-t border-[#e6ded5] bg-[#faf7f2] px-3 py-3">
          {isSubmitted ? (
            <div className="flex gap-2">
              {/* <a
                href="/api/chat-pdf"
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2
                border rounded-full py-2 text-sm"
              >
                <FileDown size={16} /> Download PDF
              </a> */}
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2
                border rounded-full py-2 text-sm"
              >
                <RefreshCw size={16} /> New Chat
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || isSummary || isRegionStep}
                className="flex-1 rounded-full px-4 py-2 text-sm
                border bg-white disabled:opacity-50"
                placeholder="Type your message…"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-full bg-[#8b5a3c]
                text-white flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100]
          rounded-xl bg-[#2f855a] text-white
          px-4 py-2 text-sm shadow-lg"
        >
          {toast}
        </div>
      )}
    </>
  );
}
