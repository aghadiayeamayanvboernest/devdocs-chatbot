"use client";

import { useChatStore } from "@/store/chat-store";
import { SUPPORTED_FRAMEWORKS, Framework } from "@/types/api";
import clsx from "clsx";

export function FrameworkSelector() {
  const selectedFrameworks = useChatStore((state) => state.selectedFrameworks);
  const toggleFramework = useChatStore((state) => state.toggleFramework);

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">
        Select Frameworks
      </label>
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_FRAMEWORKS.map((framework) => {
          const isSelected = selectedFrameworks.includes(framework);
          return (
            <button
              key={framework}
              onClick={() => toggleFramework(framework as Framework)}
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isSelected
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {framework}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">
        {selectedFrameworks.length} framework{selectedFrameworks.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}
