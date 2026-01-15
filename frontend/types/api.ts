/**
 * TypeScript types for DevDocs AI Chatbot API
 * Matches backend Pydantic models
 */

// Chat types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SourceNode {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, any>;
  url?: string;
  framework?: string;
}

export interface ChatRequest {
  message: string;
  frameworks?: string[];
  history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  sources: SourceNode[];
  trace_id?: string;
}

// Code generation types
export interface CodeGenerationRequest {
  prompt: string;
  frameworks?: string[];
  history?: ChatMessage[];
  include_docs_context?: boolean;
}

export interface CodeGenerationResponse {
  code: string;
  trace_id?: string;
}

// Feedback types
export interface FeedbackRequest {
  trace_id: string;
  value: "positive" | "negative";
  comment?: string;
}

export interface FeedbackResponse {
  status: string;
  trace_id: string;
}

// Health check
export interface HealthResponse {
  status: string;
  version: string;
}

// Supported frameworks
export const SUPPORTED_FRAMEWORKS = [
  "react",
  "nextjs",
  "tailwind",
  "fastapi",
  "django",
  "postgresql",
  "typescript",
] as const;

export type Framework = typeof SUPPORTED_FRAMEWORKS[number];
