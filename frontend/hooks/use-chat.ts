/**
 * Custom hook for chat and code generation operations
 */
import { useMutation } from "@tanstack/react-query";
import { useChatStore } from "@/store/chat-store";
import api from "@/lib/api-client";
import type { FeedbackRequest } from "@/types/api";

interface ChatPayload {
  message: string;
  files?: File[];
}

interface CodePayload {
  prompt: string;
  files?: File[];
}

/**
 * Hook for sending chat messages (documentation Q&A)
 */
export function useChat() {
  const { addMessage, updateLastMessage, setIsLoading, setError, setAbortController } =
    useChatStore();
  const selectedFrameworks = useChatStore((state) => state.selectedFrameworks);
  const messages = useChatStore((state) => state.messages);

  const mutation = useMutation({
    mutationFn: async ({ message, files }: ChatPayload) => {
      const controller = new AbortController();
      setAbortController(controller);

      // Build user message content with file names
      let userContent = message;
      if (files && files.length > 0) {
        const fileNames = files.map((f) => f.name).join(", ");
        userContent = message
          ? `${message}\n\n[Attached files: ${fileNames}]`
          : `[Attached files: ${fileNames}]`;
      }

      addMessage({
        role: "user",
        content: userContent,
      });

      addMessage({
        role: "assistant",
        content: "",
        isGenerating: true,
      });

      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      return api.chatWithFiles(message, selectedFrameworks, history, files, controller.signal);
    },
    onSuccess: (data) => {
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

  const sendMessage = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;
    setIsLoading(true);
    setError(null);
    await mutation.mutateAsync({ message, files });
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
    mutationFn: async ({ prompt, files }: CodePayload) => {
      const controller = new AbortController();
      setAbortController(controller);

      // Build user message content with file names
      let userContent = prompt;
      if (files && files.length > 0) {
        const fileNames = files.map((f) => f.name).join(", ");
        userContent = prompt
          ? `${prompt}\n\n[Attached files: ${fileNames}]`
          : `[Attached files: ${fileNames}]`;
      }

      addMessage({
        role: "user",
        content: userContent,
      });

      addMessage({
        role: "assistant",
        content: "",
        isGenerating: true,
      });

      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      return api.generateCodeWithFiles(
        prompt,
        selectedFrameworks,
        history,
        includeDocsContext,
        files,
        controller.signal
      );
    },
    onSuccess: (data) => {
      updateLastMessage({
        content: data.code,
        trace_id: data.trace_id,
        isGenerating: false,
      });
      setError(null);
      setAbortController(null);
    },
    onError: (error: Error) => {
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

  const generateCode = async (prompt: string, files?: File[]) => {
    if (!prompt.trim() && (!files || files.length === 0)) return;
    setIsLoading(true);
    setError(null);
    await mutation.mutateAsync({ prompt, files });
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
