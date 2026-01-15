"use client";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <img
            src="/favicon.svg"
            alt="DevDocs AI Logo"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="text-gray-900">
            DevDocs <span className="text-primary-600">AI</span>
          </span>
        </h1>
      </div>
    </header>
  );
}
