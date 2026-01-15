"use client";

import { useChatStore } from "@/store/chat-store";
import clsx from "clsx";

export function ModeToggle() {
  const mode = useChatStore((state) => state.mode);
  const setMode = useChatStore((state) => state.setMode);
  const includeDocsContext = useChatStore(
    (state) => state.includeDocsContext
  );
  const setIncludeDocsContext = useChatStore(
    (state) => state.setIncludeDocsContext
  );

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("documentation")}
            className={clsx(
              "flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              mode === "documentation"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <div className="font-semibold">Documentation Q&A</div>
            <div className="text-xs opacity-80">Ask questions about docs</div>
          </button>
          <button
            onClick={() => setMode("code-generation")}
            className={clsx(
              "flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              mode === "code-generation"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <div className="font-semibold">Code Generation</div>
            <div className="text-xs opacity-80">Generate production code</div>
          </button>
        </div>
      </div>

      {/* Include docs context toggle (only for code generation) */}
      {mode === "code-generation" && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div>
            <div className="text-sm font-medium text-gray-700">
              Include Documentation Context
            </div>
            <div className="text-xs text-gray-500">
              Fetch relevant docs before generating code
            </div>
          </div>
          <button
            onClick={() => setIncludeDocsContext(!includeDocsContext)}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              includeDocsContext ? "bg-blue-600" : "bg-gray-300"
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                includeDocsContext ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      )}
    </div>
  );
}
