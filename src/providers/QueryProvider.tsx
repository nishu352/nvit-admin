"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds fresh data
            gcTime: 5 * 60 * 1000, // 5 minutes cache retention
            refetchOnWindowFocus: false, // Avoid refetches when switching browser tabs
            refetchOnMount: false, // Prevent aggressive remount refetches
            retry: 1, // Fast failure feedback
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
