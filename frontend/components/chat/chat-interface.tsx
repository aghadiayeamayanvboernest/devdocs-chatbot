"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { useHydration } from "@/hooks/use-hydration";
import { Message } from "./message";
import { ChatInput } from "./chat-input";
import { useChat, useCodeGeneration } from "@/hooks/use-chat";

// Pool of example prompts
const EXAMPLE_PROMPTS = [
  // Documentation questions
  "How do I use React hooks?",
  "How to create a form in Next.js?",
  "Connect Django to PostgreSQL",
  "What is useState in React?",
  "How to handle routing in Next.js?",
  "Set up Tailwind CSS with Next.js",
  "Create API endpoints in FastAPI",
  "How to use TypeScript with React?",
  "Django models and migrations",
  "PostgreSQL query optimization",
  "React context API usage",
  "Next.js server-side rendering",
  "FastAPI dependency injection",
  "Tailwind responsive design",
  "TypeScript generics explained",
  "Django REST framework setup",
  "React useEffect hook",
  "Next.js image optimization",

  // Code generation prompts
  "Build a todo app with React",
  "Create a landing page with Next.js",
  "Blog with Django",
  "Contact form with React and TypeScript",
  "Weather app using React hooks",
  "E-commerce product page with Next.js",
  "User authentication with FastAPI",
  "Dashboard with charts using React",
  "Portfolio website with Next.js and Tailwind",
  "API with Django REST framework",
  "Search bar with autocomplete in React",
  "Dark mode toggle with Tailwind",
  "Image gallery with React",
  "Admin panel with Next.js",
  "Login form with validation",
  "Recipe app with React",
  "Markdown blog with Next.js",
  "Task tracker with Django",
];

// Function to get random prompts
function getRandomPrompts(count: number): string[] {
  const shuffled = [...EXAMPLE_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Example prompt component
function ExamplePrompt({ text }: { text: string }) {
  const { sendMessage } = useChat();
  const { generateCode } = useCodeGeneration();
  const mode = useChatStore((state) => state.mode);
  const isLoading = useChatStore((state) => state.isLoading);

  const handleClick = () => {
    if (isLoading) return;

    if (mode === "documentation") {
      sendMessage(text);
    } else {
      generateCode(text);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="group relative rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      <p className="text-sm text-gray-700 group-hover:text-gray-900">
        {text}
      </p>
    </button>
  );
}

export function ChatInterface() {
  const hydrated = useHydration();
  const messages = useChatStore((state) => state.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get random prompts on mount (changes on page reload)
  const [examplePrompts] = useState(() => getRandomPrompts(4));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Prevent hydration mismatch
  if (!hydrated) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="flex h-full items-center justify-center px-4">
            <div className="max-w-3xl text-center">
              <div className="mb-6 text-5xl">✨</div>
              <h2 className="mb-3 text-3xl font-semibold text-gray-900">
                Loading...
              </h2>
            </div>
          </div>
        </div>
        <ChatInput />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 pb-32">
            <div className="max-w-3xl w-full">
              {/* Greeting */}
              <div className="text-center mb-12">
                <h2 className="mb-2 text-4xl font-semibold text-gray-900">
                  {getGreeting()}
                </h2>
                <p className="text-gray-500 text-base">
                  How can I help you today?
                </p>
              </div>

              {/* Example Prompts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {examplePrompts.map((prompt, index) => (
                  <ExamplePrompt key={index} text={prompt} />
                ))}
              </div>

              {/* Quick Tip */}
              <div className="mt-8 max-w-2xl mx-auto text-center">
                <p className="text-sm text-gray-500">
                  💡 <span className="font-medium">Tip:</span> Select frameworks from the sidebar for better results
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput />
    </div>
  );
}
