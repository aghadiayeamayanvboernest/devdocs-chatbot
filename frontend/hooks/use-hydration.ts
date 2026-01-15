/**
 * Hook to handle Zustand hydration in Next.js
 * Prevents hydration mismatches by ensuring client has hydrated
 */
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chat-store";

export function useHydration() {
  const [isClient, setIsClient] = useState(false);
  const hasStoreHydrated = useChatStore((state) => state._hasHydrated);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only consider hydrated when both client-side and store has rehydrated
  return isClient && hasStoreHydrated;
}
