"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Web3AuthProvider as Web3AuthReactProvider } from "@web3auth/modal/react";
import web3AuthContextConfig from "@/lib/web3auth-config";

// Create query client for React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 3,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

interface Web3AuthProviderProps {
    children: ReactNode;
}

export function Web3AuthProvider({ children }: Web3AuthProviderProps) {
    console.log("Web3AuthProvider component rendering with React provider approach...");
    
    return (
        <Web3AuthReactProvider config={web3AuthContextConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </Web3AuthReactProvider>
    );
}

// Export the query client for potential use elsewhere
export { queryClient };