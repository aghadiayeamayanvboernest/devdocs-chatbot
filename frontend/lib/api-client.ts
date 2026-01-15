/**
 * API client for DevDocs AI Chatbot backend
 */
import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  CodeGenerationRequest,
  CodeGenerationResponse,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
} from "@/types/api";

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes for code generation (large projects take time)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.status} ${response.statusText}`);
    return response;
  },
  (error: AxiosError) => {
    console.error("[API] Response error:", error.response?.status, error.message);

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = (error.response.data as { detail?: string })?.detail || error.message;

      if (status === 422) {
        throw new Error(`Validation error: ${message}`);
      } else if (status === 500) {
        throw new Error(`Server error: ${message}`);
      } else if (status === 404) {
        throw new Error("Endpoint not found");
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error("No response from server. Please check your connection.");
    }

    throw error;
  }
);

/**
 * API service methods
 */
export const api = {
  /**
   * Health check
   */
  health: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>("/health");
    return response.data;
  },

  /**
   * Chat endpoint - Documentation Q&A
   */
  chat: async (request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>("/api/chat", request, { signal });
    return response.data;
  },

  /**
   * Chat endpoint with file uploads
   */
  chatWithFiles: async (
    message: string,
    frameworks: string[],
    history: ChatMessage[],
    files?: File[],
    signal?: AbortSignal
  ): Promise<ChatResponse> => {
    // If no files, use regular JSON endpoint
    if (!files || files.length === 0) {
      const request: ChatRequest = { message, frameworks, history };
      return api.chat(request, signal);
    }

    // Use FormData for file uploads
    const formData = new FormData();
    formData.append("message", message);
    formData.append("frameworks", JSON.stringify(frameworks));
    formData.append("history", JSON.stringify(history));

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiClient.post<ChatResponse>("/api/chat/upload", formData, {
      signal,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Code generation endpoint
   */
  generateCode: async (
    request: CodeGenerationRequest,
    signal?: AbortSignal
  ): Promise<CodeGenerationResponse> => {
    const response = await apiClient.post<CodeGenerationResponse>(
      "/api/generate",
      request,
      { signal }
    );
    return response.data;
  },

  /**
   * Code generation with file uploads
   */
  generateCodeWithFiles: async (
    prompt: string,
    frameworks: string[],
    history: ChatMessage[],
    includeDocsContext: boolean,
    files?: File[],
    signal?: AbortSignal
  ): Promise<CodeGenerationResponse> => {
    // If no files, use regular JSON endpoint
    if (!files || files.length === 0) {
      const request: CodeGenerationRequest = {
        prompt,
        frameworks,
        history,
        include_docs_context: includeDocsContext,
      };
      return api.generateCode(request, signal);
    }

    // Use FormData for file uploads
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("frameworks", JSON.stringify(frameworks));
    formData.append("history", JSON.stringify(history));
    formData.append("include_docs_context", String(includeDocsContext));

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiClient.post<CodeGenerationResponse>(
      "/api/generate/upload",
      formData,
      {
        signal,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Submit feedback for a trace
   */
  submitFeedback: async (
    request: FeedbackRequest
  ): Promise<FeedbackResponse> => {
    const response = await apiClient.post<FeedbackResponse>(
      "/api/chat/feedback",
      request
    );
    return response.data;
  },
};

export default api;
