"use client";

import { Message as MessageType } from "@/store/chat-store";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import clsx from "clsx";
import { useFeedback } from "@/hooks/use-chat";

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);
  const isUser = message.role === "user";

  const { submitFeedback: submitFeedbackApi, isLoading: submittingFeedback } = useFeedback();

  // Convert inline citations [N] to clickable links
  const renderContentWithCitations = (content: string) => {
    if (!message.sources || message.sources.length === 0) {
      return content;
    }

    // Replace [N] with clickable links
    return content.replace(/\[(\d+)\]/g, (match, num) => {
      const index = parseInt(num) - 1;
      if (message.sources && index >= 0 && index < message.sources.length) {
        const source = message.sources[index];
        return `[${num}](${source.url})`;
      }
      return match;
    });
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
      } else {
        setCopiedResponse(true);
        setTimeout(() => setCopiedResponse(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFeedback = async (value: "positive" | "negative") => {
    if (!message.trace_id || submittingFeedback || feedback !== null) return;

    try {
      await submitFeedbackApi(message.trace_id, value);
      setFeedback(value);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return (
    <div
      className={clsx(
        "group w-full border-b border-gray-100 px-4 py-6",
        isUser ? "bg-white" : "bg-gray-50"
      )}
    >
      <div className={clsx(
        "mx-auto flex max-w-3xl gap-3 md:gap-4",
        isUser ? "flex-row-reverse justify-start" : "flex-row"
      )}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-600 p-1">
              <img src="/favicon.svg" alt="AI" className="h-full w-full" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={clsx(
          "space-y-4 overflow-hidden",
          isUser ? "max-w-[70%]" : "flex-1 min-w-0"
        )}>
        {/* Loading indicator */}
        {message.isGenerating && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {/* Message content */}
        {!message.isGenerating && message.content && (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  a({ href, children }) {
                    // Handle citation links
                    const childText = String(children);
                    const citationMatch = childText.match(/^(\d+)$/);
                    if (citationMatch) {
                      // This is a citation number without brackets from markdown conversion
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium no-underline hover:underline"
                        >
                          [{children}]
                        </a>
                      );
                    }
                    // Regular links
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {children}
                      </a>
                    );
                  },
                  code({ className, children }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

                    return match ? (
                      <div className="relative group/code my-4">
                        <button
                          onClick={() => copyToClipboard(codeString, codeId)}
                          className="absolute right-2 top-2 z-10 rounded bg-gray-700 p-2 text-white opacity-0 transition-opacity hover:bg-gray-600 group-hover/code:opacity-100"
                          title={copiedCode === codeId ? "Copied!" : "Copy code"}
                        >
                          {copiedCode === codeId ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        <div className="rounded-lg overflow-hidden border border-gray-700">
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              lineHeight: '1.5',
                            }}
                            showLineNumbers={false}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ) : (
                      <code className={clsx(className, "rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-pink-600")}>
                         {children}
                      </code>
                    );
                  },
                }}
              >
                {renderContentWithCitations(message.content)}
              </ReactMarkdown>
            </div>

            {/* Copy entire response button and feedback buttons - at bottom, always visible */}
            {!isUser && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className="flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50"
                  title={copiedResponse ? "Copied!" : "Copy response"}
                >
                  {copiedResponse ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>

                {/* Thumbs up/down feedback buttons */}
                {message.trace_id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleFeedback("positive")}
                      disabled={submittingFeedback || feedback !== null}
                      className={clsx(
                        "rounded-lg border p-2 transition-colors disabled:cursor-not-allowed",
                        feedback === "positive"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-black hover:text-white hover:border-black"
                      )}
                      title="Good response"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleFeedback("negative")}
                      disabled={submittingFeedback || feedback !== null}
                      className={clsx(
                        "rounded-lg border p-2 transition-colors disabled:cursor-not-allowed",
                        feedback === "negative"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-black hover:text-white hover:border-black"
                      )}
                      title="Bad response"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Sources:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {message.sources.map((source, idx) => {
                  // Extract title from URL or use framework name
                  const getTitle = () => {
                    if (!source.url) return `Source ${idx + 1}`;

                    try {
                      const url = new URL(source.url);
                      const pathParts = url.pathname.split('/').filter(Boolean);
                      const lastPart = pathParts[pathParts.length - 1] || 'Documentation';

                      // Convert URL segments to readable titles
                      const title = lastPart
                        .replace(/-/g, ' ')
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                      return source.framework
                        ? `${source.framework.charAt(0).toUpperCase() + source.framework.slice(1)} - ${title}`
                        : title;
                    } catch {
                      return source.framework || `Source ${idx + 1}`;
                    }
                  };

                  return (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition-colors"
                      title={source.text.substring(0, 150) + '...'}
                    >
                      <span>[{idx + 1}]</span>
                      <span>{getTitle()}</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
