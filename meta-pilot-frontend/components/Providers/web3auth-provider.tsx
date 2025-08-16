"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { Web3Auth } from "@web3auth/modal";
import { WALLET_CONNECTORS, WEB3AUTH_NETWORK, AUTH_CONNECTION } from "@web3auth/modal";
import type { IProvider, IWeb3AuthCore } from "@web3auth/base";
import type { Web3AuthOptions } from "@web3auth/modal";

// Enhanced context type for Web3Auth modal
type Web3AuthContextType = {
    web3auth: Web3Auth | null;
    provider: IProvider | null;
    isConnected: boolean;
    isConnecting: boolean;
    setIsConnecting: (value: boolean) => void;
    connectionError: string | null;
    setConnectionError: (error: string | null) => void;
    currentNetwork: 'ethereum' | 'solana';
    setCurrentNetwork: (network: 'ethereum' | 'solana') => void;
    connectTo: (provider: string) => Promise<void>;
    disconnect: () => Promise<void>;
    getUserInfo: () => any;
};

const Web3AuthContext = createContext<Web3AuthContextType>({
    web3auth: null,
    provider: null,
    isConnected: false,
    isConnecting: false,
    setIsConnecting: () => { },
    connectionError: null,
    setConnectionError: () => { },
    currentNetwork: 'ethereum',
    setCurrentNetwork: () => { },
    connectTo: async () => { },
    disconnect: async () => { },
    getUserInfo: () => null,
});

export const useWeb3AuthContext = () => useContext(Web3AuthContext);

// Web3Auth modal configuration - no chain config needed for modal version

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
    console.log("Web3AuthProvider component rendering...");
    
    // Move client ID inside component
    const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BD9DUH4UyRVXj9QTT56HNowmVdDv6QMFKGwmf22Ht803nO-kUpTKmevwO1RTlkUTtMQQkeHEAJcySQa1ZopsBl0";
    console.log("CLIENT ID IN COMPONENT:", clientId);
    
    const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
    const [provider, setProvider] = useState<IProvider | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [currentNetwork, setCurrentNetwork] = useState<'ethereum' | 'solana'>('ethereum');

    useEffect(() => {
        console.log("🔥🔥🔥 USE EFFECT RUNNING FOR WEB3AUTH MODAL 🔥🔥🔥");
        console.log("Dependencies - clientId:", clientId);
        
        const init = async () => {
            console.log("🚀 INIT FUNCTION CALLED - MODAL VERSION");
            try {
                console.log("Starting Web3Auth MODAL initialization...");
                console.log("Client ID:", clientId);
                
                if (!clientId) {
                    throw new Error("Web3Auth Client ID is not set");
                }
                
                // Initialize Web3Auth Modal
                const web3authOptions: Web3AuthOptions = {
                    clientId,
                    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
                    modalConfig: {
                        connectors: {
                            [WALLET_CONNECTORS.AUTH]: {
                                label: "auth",
                                loginMethods: {
                                    google: {
                                        name: "google login",
                                        showOnModal: true,
                                    },
                                    facebook: {
                                        name: "facebook login",
                                        showOnModal: true,
                                    },
                                    twitter: {
                                        name: "twitter login",
                                        showOnModal: true,
                                    },
                                    discord: {
                                        name: "discord login",
                                        showOnModal: true,
                                    },
                                    linkedin: {
                                        name: "linkedin login",
                                        showOnModal: true,
                                    },
                                    github: {
                                        name: "github login",
                                        showOnModal: true,
                                    },
                                    apple: {
                                        name: "apple login",
                                        showOnModal: true,
                                    },
                                    email_passwordless: {
                                        name: "email passwordless login",
                                        showOnModal: true,
                                    },
                                },
                                showOnModal: true,
                            }
                        },
                    },
                    uiConfig: {
                        appName: "MetaPilot",
                        appUrl: "https://metapilot.io",
                        theme: {
                            primary: "#3B82F6",
                        },
                        logoLight: "https://web3auth.io/docs/images/logo.png",
                        logoDark: "https://web3auth.io/docs/images/logo.png",
                        defaultLanguage: "en",
                        mode: "dark",
                    },
                };

                const web3authInstance = new Web3Auth(web3authOptions);

                console.log("Web3Auth Modal instance created successfully");

                await web3authInstance.init();

                console.log("Web3Auth Modal initialized successfully!");
                console.log("Connected:", web3authInstance.connected);
                console.log("Provider:", web3authInstance.provider);

                setWeb3auth(web3authInstance);
                setProvider(web3authInstance.provider);
                setIsConnected(web3authInstance.connected);
                setConnectionError(null);
            } catch (error) {
                console.error("Web3Auth Modal initialization failed with error:", error);
                console.error("Error details:", error.message);
                console.error("Error stack:", error.stack);
                setConnectionError(`Failed to initialize Web3Auth Modal: ${error.message}`);
                setWeb3auth(null);
            }
        };

        // Add a small delay to ensure DOM is ready
        console.log("⏰ Setting timeout for modal init...");
        const timer = setTimeout(() => {
            console.log("⏰ Timeout reached, calling modal init...");
            init();
        }, 100);

        return () => clearTimeout(timer);
    }, []); // Run only on mount

    const connectTo = async (loginProvider: string) => {
        console.log("connectTo called with provider:", loginProvider);
        console.log("web3auth modal instance:", web3auth);
        
        if (!web3auth) {
            console.error("Web3Auth Modal not initialized");
            setConnectionError("Web3Auth Modal not initialized");
            return;
        }

        try {
            setIsConnecting(true);
            setConnectionError(null);

            console.log("Attempting to connect with basic modal approach...");
            
            // For basic Web3Auth modal social login, just use the built-in modal
            // The modal will show all configured social providers
            const web3authProvider = await web3auth.connect();

            console.log("Modal connection successful, provider:", web3authProvider);
            setProvider(web3authProvider);
            setIsConnected(true);
        } catch (error) {
            console.error("Modal connection failed:", error);
            setConnectionError(error instanceof Error ? error.message : "Connection failed");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        if (!web3auth) return;

        try {
            // Check if actually connected before attempting logout
            if (web3auth.connected) {
                await web3auth.logout();
            }
            
            // Always clear the state regardless
            setProvider(null);
            setIsConnected(false);
        } catch (error) {
            console.error("Disconnect failed:", error);
            // Even if logout fails, clear the local state
            setProvider(null);
            setIsConnected(false);
        }
    };

    const getUserInfo = () => {
        if (!web3auth || !isConnected) return null;
        try {
            return web3auth.getUserInfo();
        } catch (error) {
            console.error("Failed to get user info:", error);
            return null;
        }
    };

    return (
        <Web3AuthContext.Provider
            value={{
                web3auth,
                provider,
                isConnected,
                isConnecting,
                setIsConnecting,
                connectionError,
                setConnectionError,
                currentNetwork,
                setCurrentNetwork,
                connectTo,
                disconnect,
                getUserInfo,
            }}
        >
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </Web3AuthContext.Provider>
    );
}

// Export the query client for potential use elsewhere
export { queryClient };