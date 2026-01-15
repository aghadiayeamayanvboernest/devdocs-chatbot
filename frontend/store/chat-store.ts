/**
 * Zustand store for chat and code generation state
 */
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ChatMessage, SourceNode, Framework } from "@/types/api";

// Message type with additional UI fields
export interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  sources?: SourceNode[];
  trace_id?: string;
  isGenerating?: boolean;
}

// Chat mode
export type ChatMode = "documentation" | "code-generation";

// Store state interface
interface ChatState {
  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateLastMessage: (update: Partial<Message>) => void;
  clearMessages: () => void;

  // Selected frameworks
  selectedFrameworks: Framework[];
  toggleFramework: (framework: Framework) => void;
  setFrameworks: (frameworks: Framework[]) => void;

  // Chat mode
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Abort controller
  abortController: AbortController | null;
  setAbortController: (controller: AbortController | null) => void;
  stopGeneration: () => void;

  // Settings
  includeDocsContext: boolean;
  setIncludeDocsContext: (include: boolean) => void;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// Create store with devtools and persist middleware
export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        messages: [],
        selectedFrameworks: ["react", "nextjs", "typescript"],
        mode: "documentation",
        isLoading: false,
        error: null,
        abortController: null,
        includeDocsContext: true,
        _hasHydrated: false,

        // Message actions
        addMessage: (message) => {
          const newMessage: Message = {
            ...message,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
          };

          set((state) => ({
            messages: [...state.messages, newMessage],
          }));
        },

        updateLastMessage: (update) => {
          set((state) => {
            const messages = [...state.messages];
            const lastIndex = messages.length - 1;

            if (lastIndex >= 0) {
              messages[lastIndex] = {
                ...messages[lastIndex],
                ...update,
              };
            }

            return { messages };
          });
        },

        clearMessages: () => {
          set({ messages: [] });
        },

        // Framework actions
        toggleFramework: (framework) => {
          set((state) => {
            const frameworks = state.selectedFrameworks;
            const exists = frameworks.includes(framework);

            if (exists) {
              // Don't allow removing all frameworks
              if (frameworks.length === 1) {
                return state;
              }
              return {
                selectedFrameworks: frameworks.filter((f) => f !== framework),
              };
            } else {
              return {
                selectedFrameworks: [...frameworks, framework],
              };
            }
          });
        },

        setFrameworks: (frameworks) => {
          // Ensure at least one framework is selected
          if (frameworks.length === 0) return;
          set({ selectedFrameworks: frameworks });
        },

        // Mode actions
        setMode: (mode) => {
          set({ mode });
        },

        // UI state actions
        setIsLoading: (loading) => {
          set({ isLoading: loading });
        },

        setError: (error) => {
          set({ error });
        },

        // Abort controller actions
        setAbortController: (controller) => {
          set({ abortController: controller });
        },

        stopGeneration: () => {
          const { abortController } = get();
          if (abortController) {
            abortController.abort();
            set({ abortController: null, isLoading: false });
          }
        },

        // Settings actions
        setIncludeDocsContext: (include) => {
          set({ includeDocsContext: include });
        },

        // Hydration actions
        setHasHydrated: (state) => {
          set({ _hasHydrated: state });
        },
      }),
      {
        name: "devdocs-chat-store",
        // Only persist certain fields
        partialize: (state) => ({
          selectedFrameworks: state.selectedFrameworks,
          mode: state.mode,
          includeDocsContext: state.includeDocsContext,
        }),
        // Set hydration state when rehydration completes
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      }
    ),
    {
      name: "ChatStore",
    }
  )
);

// Selector hooks for optimized re-renders
export const useMessages = () => useChatStore((state) => state.messages);
export const useSelectedFrameworks = () =>
  useChatStore((state) => state.selectedFrameworks);
export const useChatMode = () => useChatStore((state) => state.mode);
export const useIsLoading = () => useChatStore((state) => state.isLoading);
export const useError = () => useChatStore((state) => state.error);
