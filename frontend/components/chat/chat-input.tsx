"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useChatStore } from "@/store/chat-store";
import { useHydration } from "@/hooks/use-hydration";
import { useChat, useCodeGeneration } from "@/hooks/use-chat";

export function ChatInput() {
  const hydrated = useHydration();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mode = useChatStore((state) => state.mode);
  const isLoading = useChatStore((state) => state.isLoading);
  const stopGeneration = useChatStore((state) => state.stopGeneration);

  const { sendMessage } = useChat();
  const { generateCode } = useCodeGeneration();

  const handleSubmit = async () => {
    if (!input.trim() || isLoading || !hydrated) return;

    const message = input.trim();
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Send to appropriate endpoint based on mode
    if (mode === "documentation") {
      await sendMessage(message);
    } else {
      await generateCode(message);
    }
  };

  const handleStop = () => {
    stopGeneration();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const placeholder =
    mode === "documentation"
      ? "Ask a question about the documentation..."
      : "Describe the code you want to generate...";

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="mx-auto max-w-3xl px-4">
        <div className="relative flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || !hydrated}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ maxHeight: "200px" }}
          />
          <button
            onClick={isLoading ? handleStop : handleSubmit}
            disabled={!hydrated || (!isLoading && !input.trim())}
            className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label={isLoading ? "Stop generation" : "Send message"}
          >
            {isLoading ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
