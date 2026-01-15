"use client";

import { useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { SUPPORTED_FRAMEWORKS, Framework } from "@/types/api";
import { useHydration } from "@/hooks/use-hydration";
import clsx from "clsx";

export function Sidebar() {
  const hydrated = useHydration();
  const clearMessages = useChatStore((state) => state.clearMessages);
  const messages = useChatStore((state) => state.messages);
  const mode = useChatStore((state) => state.mode);
  const setMode = useChatStore((state) => state.setMode);
  const selectedFrameworks = useChatStore((state) => state.selectedFrameworks);
  const toggleFramework = useChatStore((state) => state.toggleFramework);
  const includeDocsContext = useChatStore((state) => state.includeDocsContext);
  const setIncludeDocsContext = useChatStore((state) => state.setIncludeDocsContext);

  const [showFrameworks, setShowFrameworks] = useState(true);

  // Prevent hydration mismatch by not rendering until client has hydrated
  if (!hydrated) {
    return (
      <div className="flex h-full w-80 flex-col bg-gray-900 text-white">
        <div className="p-3">
          <div className="flex w-full items-center gap-3 rounded-lg border border-gray-700 px-4 py-3 text-sm">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-80 flex-col bg-gray-900 text-white">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={clearMessages}
          disabled={messages.length === 0}
          className="flex w-full items-center gap-3 rounded-lg border border-gray-700 px-4 py-3 text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Mode
          </label>
          <div className="space-y-1">
            <button
              onClick={() => setMode("documentation")}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                mode === "documentation"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Documentation Q&A
            </button>
            <button
              onClick={() => setMode("code-generation")}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                mode === "code-generation"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code Generation
            </button>
          </div>
        </div>

        {/* Include Docs Context (Code Gen only) */}
        {mode === "code-generation" && (
          <div className="rounded-lg bg-gray-800 p-3">
            <button
              onClick={() => setIncludeDocsContext(!includeDocsContext)}
              className="flex w-full items-center justify-between text-sm"
            >
              <span className="text-gray-300">Use Documentation</span>
              <div
                className={clsx(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  includeDocsContext ? "bg-primary-600" : "bg-gray-600"
                )}
              >
                <span
                  className={clsx(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    includeDocsContext ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </div>
            </button>
          </div>
        )}

        {/* Frameworks */}
        <div className="space-y-2">
          <button
            onClick={() => setShowFrameworks(!showFrameworks)}
            className="flex w-full items-center justify-between px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300"
          >
            <span>Frameworks ({selectedFrameworks.length})</span>
            <svg
              className={clsx(
                "h-4 w-4 transition-transform",
                showFrameworks && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFrameworks && (
            <div className="space-y-1">
              {SUPPORTED_FRAMEWORKS.map((framework) => {
                const isSelected = selectedFrameworks.includes(framework);
                const isOnlySelected = isSelected && selectedFrameworks.length === 1;
                return (
                  <button
                    key={framework}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFramework(framework as Framework);
                    }}
                    disabled={isOnlySelected}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
                      isSelected
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-300",
                      isOnlySelected && "opacity-50 cursor-not-allowed"
                    )}
                    title={isOnlySelected ? "At least one framework must be selected" : ""}
                  >
                    <div
                      className={clsx(
                        "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                        isSelected
                          ? "border-primary-600 bg-primary-600"
                          : "border-gray-600"
                      )}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="capitalize">{framework}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 p-3">
        <div className="text-center text-xs text-gray-500">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
