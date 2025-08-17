"use client";

import { useMultiChainWallet } from "./use-multi-chain-wallet";

export function useWallet() {
    // Delegate to the multi-chain wallet hook for Web3Auth compatibility
    const multiChainWallet = useMultiChainWallet();
    
    // Map multi-chain wallet data to traditional wallet interface
    const address = multiChainWallet.primaryAddress;
    const isConnected = multiChainWallet.isConnected;
    const status = isConnected ? 'connected' : 'disconnected';
    const isConnecting = multiChainWallet.isConnecting;
    const balance = multiChainWallet.balance;

    // Format address for display
    const formatAddress = multiChainWallet.formatAddress;

    // Handle connect - delegate to multi-chain wallet
    const handleConnect = async (connectorId: string) => {
        // For now, just use the multi-chain wallet's connect function
        // This could be enhanced to map specific connector IDs to Web3Auth methods
        await multiChainWallet.connect(connectorId);
    };

    // Handle disconnect
    const handleDisconnect = async () => {
        await multiChainWallet.disconnect();
    };

    return {
        address,
        isConnected,
        status,
        isConnecting,
        isPending: isConnecting,
        balance,
        formatAddress,
        connect: handleConnect,
        disconnect: handleDisconnect,
        error: multiChainWallet.error,
    };
}