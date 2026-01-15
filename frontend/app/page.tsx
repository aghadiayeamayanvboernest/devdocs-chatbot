"use client";

import { Sidebar } from "@/components/sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Header } from "@/components/layout/header";

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - always visible */}
      <div className="w-80">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-hidden">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}
