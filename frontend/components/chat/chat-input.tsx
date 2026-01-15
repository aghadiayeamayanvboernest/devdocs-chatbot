"use client";

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";
import { useChatStore } from "@/store/chat-store";
import { useHydration } from "@/hooks/use-hydration";
import { useChat, useCodeGeneration } from "@/hooks/use-chat";

// Supported file types
const ACCEPTED_FILE_TYPES = [
  ".txt", ".md", ".json", ".js", ".ts", ".tsx", ".jsx",
  ".py", ".css", ".html", ".xml", ".yaml", ".yml",
  ".csv", ".pdf"
].join(",");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

export function ChatInput() {
  const hydrated = useHydration();
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mode = useChatStore((state) => state.mode);
  const isLoading = useChatStore((state) => state.isLoading);
  const stopGeneration = useChatStore((state) => state.stopGeneration);

  const { sendMessage } = useChat();
  const { generateCode } = useCodeGeneration();

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      newFiles.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading || !hydrated) return;

    const message = input.trim();
    const files = uploadedFiles.map((f) => f.file);

    setInput("");
    setUploadedFiles([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (mode === "documentation") {
      await sendMessage(message, files);
    } else {
      await generateCode(message, files);
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
        {/* File preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm"
              >
                <svg
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="max-w-[150px] truncate text-gray-700">
                  {file.name}
                </span>
                <span className="text-gray-400">({formatFileSize(file.size)})</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  aria-label="Remove file"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !hydrated}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            aria-label="Upload file"
            title="Upload file"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

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
            disabled={!hydrated || (!isLoading && !input.trim() && uploadedFiles.length === 0)}
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
