/**
 * Custom hook for chat and code generation operations
 */
import { useMutation } from "@tanstack/react-query";
import { useChatStore } from "@/store/chat-store";
import api from "@/lib/api-client";
import type {
  ChatRequest,
  CodeGenerationRequest,
  FeedbackRequest,
} from "@/types/api";

/**
 * Hook for sending chat messages (documentation Q&A)
 */
export function useChat() {
  const { addMessage, updateLastMessage, setIsLoading, setError, setAbortController } =
    useChatStore();
  const selectedFrameworks = useChatStore((state) => state.selectedFrameworks);
  const messages = useChatStore((state) => state.messages);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      // Create abort controller
      const controller = new AbortController();
      setAbortController(controller);

      // Add user message
      addMessage({
        role: "user",
        content: message,
      });

      // Add placeholder for assistant response
      addMessage({
        role: "assistant",
        content: "",
        isGenerating: true,
      });

      // Get conversation history (last 5 messages)
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Prepare request
      const request: ChatRequest = {
        message,
        frameworks: selectedFrameworks,
        history,
      };

      // Call API with abort signal
      return api.chat(request, controller.signal);
    },
    onSuccess: (data) => {
      // Update the assistant message with response
      updateLastMessage({
        content: data.response,
        sources: data.sources,
        trace_id: data.trace_id,
        isGenerating: false,
      });
      setError(null);
      setAbortController(null);
    },
    onError: (error: Error) => {
      // Check if it was aborted
      if (error.name === 'CanceledError' || error.message.includes('abort')) {
        updateLastMessage({
          content: "Generation stopped.",
          isGenerating: false,
        });
      } else {
        updateLastMessage({
          content: "Sorry, I encountered an error. Please try again.",
          isGenerating: false,
        });
        setError(error.message);
      }
      setAbortController(null);
    },
    onSettled: () => {
      setIsLoading(false);
      setAbortController(null);
    },
  });

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    setIsLoading(true);
    setError(null);
    await mutation.mutateAsync(message);
  };

  return {
    sendMessage,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for code generation
 */
export function useCodeGeneration() {
  const { addMessage, updateLastMessage, setIsLoading, setError, setAbortController } =
    useChatStore();
  const selectedFrameworks = useChatStore((state) => state.selectedFrameworks);
  const messages = useChatStore((state) => state.messages);
  const includeDocsContext = useChatStore(
    (state) => state.includeDocsContext
  );

  const mutation = useMutation({
    mutationFn: async (prompt: string) => {
      // Create abort controller
      const controller = new AbortController();
      setAbortController(controller);

      // Add user message
      addMessage({
        role: "user",
        content: prompt,
      });

      // Add placeholder for assistant response
      addMessage({
        role: "assistant",
        content: "",
        isGenerating: true,
      });

      // Get conversation history (last 5 messages)
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Prepare request
      const request: CodeGenerationRequest = {
        prompt,
        frameworks: selectedFrameworks,
        history,
        include_docs_context: includeDocsContext,
      };

      // Call API with abort signal
      return api.generateCode(request, controller.signal);
    },
    onSuccess: (data) => {
      // Update the assistant message with generated code
      updateLastMessage({
        content: data.code,
        trace_id: data.trace_id,
        isGenerating: false,
      });
      setError(null);
      setAbortController(null);
    },
    onError: (error: Error) => {
      // Check if it was aborted
      if (error.name === 'CanceledError' || error.message.includes('abort')) {
        updateLastMessage({
          content: "Code generation stopped.",
          isGenerating: false,
        });
      } else {
        updateLastMessage({
          content: "Sorry, I encountered an error generating code. Please try again.",
          isGenerating: false,
        });
        setError(error.message);
      }
      setAbortController(null);
    },
    onSettled: () => {
      setIsLoading(false);
      setAbortController(null);
    },
  });

  const generateCode = async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    await mutation.mutateAsync(prompt);
  };

  return {
    generateCode,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for submitting feedback
 */
export function useFeedback() {
  const mutation = useMutation({
    mutationFn: async (request: FeedbackRequest) => {
      return api.submitFeedback(request);
    },
  });

  const submitFeedback = async (
    traceId: string,
    value: "positive" | "negative",
    comment?: string
  ) => {
    await mutation.mutateAsync({
      trace_id: traceId,
      value,
      comment,
    });
  };

  return {
    submitFeedback,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
