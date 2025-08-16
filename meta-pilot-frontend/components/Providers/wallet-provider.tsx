"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, createContext, useContext, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { linea, lineaSepolia, mainnet, sepolia } from "wagmi/chains";
import { metaMask, walletConnect, coinbaseWallet } from "wagmi/connectors";

type WalletContextType = {
    isConnecting: boolean;
    setIsConnecting: (value: boolean) => void;
    connectionError: string | null;
    setConnectionError: (error: string | null) => void;
};

const WalletContext = createContext<WalletContextType>({
    isConnecting: false,
    setIsConnecting: () => { },
    connectionError: null,
    setConnectionError: () => { },
});

export const useWalletContext = () => useContext(WalletContext);

// Configure Wagmi with multiple connectors
export const config = createConfig({
    chains: [mainnet, sepolia, linea, lineaSepolia],
    connectors: [
        metaMask(),
        walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "default-project-id",
        }),
        coinbaseWallet({
            appName: "MetaPilot",
        }),
    ],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [linea.id]: http(),
        [lineaSepolia.id]: http(),
    },
});

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <WalletContext.Provider
                    value={{
                        isConnecting,
                        setIsConnecting,
                        connectionError,
                        setConnectionError,
                    }}
                >
                    {children}
                </WalletContext.Provider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

