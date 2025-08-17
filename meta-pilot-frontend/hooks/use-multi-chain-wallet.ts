"use client";

import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser, useWeb3Auth } from "@web3auth/modal/react";
import { useAccount } from "wagmi"; // Ethereum
import { useSolanaWallet } from "@web3auth/modal/react/solana"; // Solana
import { WALLET_CONNECTORS, AUTH_CONNECTION } from "@web3auth/modal";
import { getED25519Key } from "@web3auth/modal";
import { Keypair, Connection } from "@solana/web3.js";
import { useEffect, useState } from "react";

export interface MultiChainWalletState {
    ethereum: {
        address?: string;
        isConnected: boolean;
        balance?: string;
        symbol?: string;
        chainId?: number;
    };
    solana: {
        address?: string;
        isConnected: boolean;
        balance?: number;
        symbol: string;
        connection?: Connection;
    };
    isLoading: boolean;
    error?: string;
}

export function useMultiChainWallet() {
    // Web3Auth hooks
    const { connectTo, isConnected, loading: connectLoading, error: connectError } = useWeb3AuthConnect();
    const { disconnect, loading: disconnectLoading } = useWeb3AuthDisconnect();
    const { userInfo } = useWeb3AuthUser();
    const { provider, isInitialized } = useWeb3Auth();
    
    // Ethereum wallet (Wagmi)
    const { address: ethAddress, isConnected: ethConnected } = useAccount();
    
    // Solana wallet
    const { accounts: solAccounts, connection: solConnection } = useSolanaWallet();
    
    // Local state
    const [solanaAddress, setSolanaAddress] = useState<string | undefined>();
    const [solanaBalance] = useState<number>(0);
    const [ethereumBalance] = useState<string>("0");
    const [currentNetwork, setCurrentNetwork] = useState<'ethereum' | 'solana'>('ethereum');
    
    // Derive Solana address from Ethereum private key
    useEffect(() => {
        const deriveSolanaAddress = async () => {
            if (provider && isConnected) {
                try {
                    const ethPrivateKey = await provider.request({ method: "private_key" });
                    const privateKey = getED25519Key(ethPrivateKey as string).sk.toString("hex");
                    const secretKey = new Uint8Array(Buffer.from(privateKey, 'hex'));
                    const keypair = Keypair.fromSecretKey(secretKey);
                    setSolanaAddress(keypair.publicKey.toBase58());
                } catch (error) {
                    console.error("Error deriving Solana address:", error);
                }
            }
        };
        
        deriveSolanaAddress();
    }, [provider, isConnected]);

    // Social authentication functions for custom modal
    const handleSocialAuth = async (provider: string) => {
        try {
            // Check if Web3Auth is initialized before attempting connection
            if (!isInitialized) {
                throw new Error("Web3Auth is not initialized yet. Please wait a moment and try again.");
            }

            const authConnectionMap: Record<string, string> = {
                google: AUTH_CONNECTION.GOOGLE,
                facebook: AUTH_CONNECTION.FACEBOOK,
                twitter: AUTH_CONNECTION.TWITTER,
                discord: AUTH_CONNECTION.DISCORD,
                linkedin: AUTH_CONNECTION.LINKEDIN,
                github: AUTH_CONNECTION.GITHUB,
                apple: AUTH_CONNECTION.APPLE,
            };

            await connectTo(WALLET_CONNECTORS.AUTH, {
                authConnection: authConnectionMap[provider] || AUTH_CONNECTION.GOOGLE,
            });
        } catch (error) {
            console.error(`${provider} authentication failed:`, error);
            throw error;
        }
    };

    // Email authentication
    const handleEmailAuth = async (email: string) => {
        try {
            // Check if Web3Auth is initialized before attempting connection
            if (!isInitialized) {
                throw new Error("Web3Auth is not initialized yet. Please wait a moment and try again.");
            }

            await connectTo(WALLET_CONNECTORS.AUTH, {
                authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
                // authConnectionId: "metapilot1", // Disabled for testing
                extraLoginOptions: {
                    login_hint: email.trim(),
                },
            });
        } catch (error) {
            console.error("Email authentication failed:", error);
            throw error;
        }
    };

    // SMS authentication
    const handleSmsAuth = async (phone: string) => {
        try {
            // Check if Web3Auth is initialized before attempting connection
            if (!isInitialized) {
                throw new Error("Web3Auth is not initialized yet. Please wait a moment and try again.");
            }

            await connectTo(WALLET_CONNECTORS.AUTH, {
                authConnection: AUTH_CONNECTION.SMS_PASSWORDLESS,
                // authConnectionId: "metapilot2", // Disabled for testing
                extraLoginOptions: {
                    login_hint: phone.trim(),
                },
            });
        } catch (error) {
            console.error("SMS authentication failed:", error);
            throw error;
        }
    };

    // Traditional wallet connection
    const handleWalletConnect = async (walletId: string) => {
        try {
            // Check if Web3Auth is initialized before attempting connection
            if (!isInitialized) {
                throw new Error("Web3Auth is not initialized yet. Please wait a moment and try again.");
            }

            const walletConnectorMap: Record<string, string> = {
                metamask: WALLET_CONNECTORS.METAMASK,
                walletconnect: WALLET_CONNECTORS.WALLET_CONNECT_V2,
                coinbase: WALLET_CONNECTORS.COINBASE,
                phantom: WALLET_CONNECTORS.METAMASK, // Phantom uses MetaMask connector
            };

            const connector = walletConnectorMap[walletId];
            if (connector) {
                await connectTo(connector as any);
            }
        } catch (error) {
            console.error(`${walletId} connection failed:`, error);
            throw error;
        }
    };

    // Format address for display
    const formatAddress = (addr?: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Build wallet state object
    const walletState: MultiChainWalletState = {
        ethereum: {
            address: ethAddress,
            isConnected: ethConnected,
            balance: ethereumBalance,
            symbol: "ETH",
            chainId: 1,
        },
        solana: {
            address: solanaAddress || solAccounts?.[0],
            isConnected: !!solanaAddress || !!solAccounts?.[0],
            balance: solanaBalance,
            symbol: "SOL",
            connection: solConnection || undefined,
        },
        isLoading: connectLoading || disconnectLoading || !isInitialized,
        error: connectError?.message,
    };

    return {
        // Connection state
        isConnected,
        isConnecting: connectLoading || disconnectLoading,
        isInitialized,
        error: connectError,
        
        // User information
        userInfo,
        
        // Wallet state
        ...walletState,
        
        // Connection methods for custom modal
        handleSocialAuth,
        handleEmailAuth,
        handleSmsAuth,
        handleWalletConnect,
        disconnect,
        
        // Utility
        formatAddress,
        
        // Network management
        currentNetwork,
        setCurrentNetwork,
        
        // Legacy compatibility (for existing components)
        address: ethAddress || solanaAddress || solAccounts?.[0],
        status: isConnected ? 'connected' : 'disconnected',
        balance: { formatted: ethereumBalance, symbol: "ETH" },
        currentWallet: ethAddress ? 'ethereum' : (solanaAddress || solAccounts?.[0]) ? 'solana' : 'none',
        primaryAddress: ethAddress || solanaAddress || solAccounts?.[0],
        
        // Connection methods (legacy)
        connect: handleSocialAuth,
    };
}