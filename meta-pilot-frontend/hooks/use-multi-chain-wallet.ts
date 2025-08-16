"use client";

import { useEffect, useState } from "react";
import { useWeb3AuthContext } from "@/components/Providers/web3auth-provider";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

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
    const { 
        provider, 
        isConnected: web3AuthConnected, 
        isConnecting, 
        setIsConnecting, 
        connectionError, 
        setConnectionError, 
        currentNetwork,
        disconnect: web3AuthDisconnect 
    } = useWeb3AuthContext();
    
    // Local state for wallet information
    const [ethAddress, setEthAddress] = useState<string | undefined>();
    const [ethBalance, setEthBalance] = useState<{formatted: string, symbol: string} | undefined>();
    const [chainId, setChainId] = useState<number | undefined>();
    const [solBalance, setSolBalance] = useState<number>(0);
    const [isLoadingSolBalance, setIsLoadingSolBalance] = useState(false);
    const [solAddress, setSolAddress] = useState<string | null>(null);

    // Extract wallet account info from Web3Auth provider
    useEffect(() => {
        const getWalletInfo = async () => {
            if (provider && web3AuthConnected) {
                try {
                    // For Web3Auth no-modal, use eth_accounts for getting accounts
                    let accounts: string[] = [];
                    
                    try {
                        const ethAccounts = await provider.request({ method: "eth_accounts" });
                        if (ethAccounts && Array.isArray(ethAccounts)) {
                            accounts = ethAccounts;
                        }
                    } catch (accountError) {
                        console.log("Failed to get accounts:", accountError);
                        // Try alternative method
                        try {
                            const address = await provider.request({ method: "eth_coinbase" });
                            if (address) {
                                accounts = [address as string];
                            }
                        } catch (fallbackError) {
                            console.log("Alternative method also failed:", fallbackError);
                        }
                    }
                    
                    if (accounts.length > 0) {
                        if (currentNetwork === 'solana') {
                            setSolAddress(accounts[0]);
                            setSolBalance(1.5); // Mock balance
                            // Clear Ethereum data
                            setEthAddress(undefined);
                            setEthBalance(undefined);
                        } else {
                            setEthAddress(accounts[0]);
                            setEthBalance({ formatted: "0.5", symbol: "ETH" });
                            setChainId(1); // Mainnet
                            // Clear Solana data
                            setSolAddress(null);
                            setSolBalance(0);
                        }
                    }
                } catch (error) {
                    console.error("Failed to get wallet info:", error);
                }
            } else {
                // Clear all data when disconnected
                setSolAddress(null);
                setSolBalance(0);
                setEthAddress(undefined);
                setEthBalance(undefined);
                setChainId(undefined);
            }
        };

        getWalletInfo();
    }, [provider, web3AuthConnected, currentNetwork]);

    // Format address for display
    const formatAddress = (addr?: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Enhanced connect function for Web3Auth
    const handleConnect = async (method?: 'social' | 'wallet', walletType?: string) => {
        setIsConnecting(true);
        setConnectionError(null);

        try {
            if (method === 'social') {
                // Social authentication through Web3Auth
                // This will be handled by the Web3Auth modal
                console.log("Social authentication will be handled by Web3Auth modal");
            } else if (method === 'wallet' && walletType) {
                // Traditional wallet connection would need to be implemented
                // For now, we'll focus on Web3Auth social authentication
                console.log(`Traditional wallet connection for ${walletType} would be implemented here`);
            }
        } catch (err) {
            console.error("Connection error:", err);
            setConnectionError(err instanceof Error ? err.message : "Connection failed");
        } finally {
            setIsConnecting(false);
        }
    };

    // Enhanced disconnect function
    const handleDisconnect = async () => {
        try {
            // Disconnect from Web3Auth
            await web3AuthDisconnect();
            
            // Clear any connection errors
            setConnectionError(null);
        } catch (error) {
            console.error("Disconnect error:", error);
        }
    };

    // Get current wallet state
    const getCurrentWallet = (): 'ethereum' | 'solana' | 'none' => {
        if (ethAddress) return 'ethereum';
        if (solAddress) return 'solana';
        return 'none';
    };

    // Check if any wallet is connected
    const isAnyWalletConnected = !!ethAddress || !!solAddress || web3AuthConnected;

    // Get primary address based on current network
    const getPrimaryAddress = () => {
        if (currentNetwork === 'solana' && solAddress) {
            return solAddress;
        }
        if (currentNetwork === 'ethereum' && ethAddress) {
            return ethAddress;
        }
        return ethAddress || solAddress;
    };

    // Build wallet state object
    const walletState: MultiChainWalletState = {
        ethereum: {
            address: ethAddress,
            isConnected: !!ethAddress,
            balance: ethBalance?.formatted,
            symbol: ethBalance?.symbol,
            chainId,
        },
        solana: {
            address: solAddress || undefined,
            isConnected: !!solAddress,
            balance: solBalance,
            symbol: 'SOL',
            connection: undefined, // Will be set up properly later
        },
        isLoading: isConnecting || isLoadingSolBalance,
        error: connectionError || undefined,
    };

    return {
        // Wallet state
        ...walletState,
        
        // Connection status
        isConnected: isAnyWalletConnected,
        isConnecting,
        currentWallet: getCurrentWallet(),
        primaryAddress: getPrimaryAddress(),
        
        // Utility functions
        formatAddress,
        
        // Connection methods
        connect: handleConnect,
        disconnect: handleDisconnect,
        
        // Network switching
        currentNetwork,
        
        // Legacy compatibility (for existing components)
        address: getPrimaryAddress(),
        status: isAnyWalletConnected ? 'connected' : 'disconnected',
        balance: currentNetwork === 'solana' ? 
            { formatted: solBalance.toString(), symbol: 'SOL' } : 
            ethBalance,
    };
}