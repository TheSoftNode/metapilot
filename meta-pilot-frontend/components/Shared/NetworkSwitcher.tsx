"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";
import { useWeb3AuthContext } from "@/components/Providers/web3auth-provider";

interface Network {
    id: string;
    name: string;
    shortName: string;
    icon: string;
    color: string;
    bgColor: string;
    description: string;
    isMainnet: boolean;
    blockExplorer: string;
    rpcUrl?: string;
    features: string[];
}

const SUPPORTED_NETWORKS: Network[] = [
    {
        id: "ethereum",
        name: "Ethereum Mainnet",
        shortName: "Ethereum",
        icon: "Ξ",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        description: "The original smart contract platform",
        isMainnet: true,
        blockExplorer: "https://etherscan.io",
        features: ["Smart Contracts", "DeFi", "NFTs", "DAOs"]
    },
    {
        id: "solana",
        name: "Solana Mainnet",
        shortName: "Solana",
        icon: "◎",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        description: "High-performance blockchain for DeFi and Web3",
        isMainnet: true,
        blockExplorer: "https://solscan.io",
        rpcUrl: "https://api.mainnet-beta.solana.com",
        features: ["High Speed", "Low Fees", "Solana Pay", "SNS"]
    }
];

interface NetworkSwitcherProps {
    className?: string;
    showNetworkInfo?: boolean;
    onNetworkChange?: (networkId: string) => void;
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ 
    className, 
    showNetworkInfo = true,
    onNetworkChange 
}) => {
    const [switching, setSwitching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { currentNetwork, ethereum, solana } = useMultiChainWallet();
    const { setCurrentNetwork } = useWeb3AuthContext();

    // Get current network data
    const currentNetworkData = SUPPORTED_NETWORKS.find(n => n.id === currentNetwork) || SUPPORTED_NETWORKS[0];

    // Get connection status for each network
    const getNetworkStatus = (networkId: string) => {
        switch (networkId) {
            case "ethereum":
                return {
                    isConnected: ethereum.isConnected,
                    address: ethereum.address,
                    balance: ethereum.balance
                };
            case "solana":
                return {
                    isConnected: solana.isConnected,
                    address: solana.address,
                    balance: solana.balance?.toString()
                };
            default:
                return { isConnected: false };
        }
    };

    // Handle network switch
    const handleNetworkSwitch = async (networkId: string) => {
        if (networkId === currentNetwork) return;

        setSwitching(true);
        setError(null);

        try {
            // Simulate switching delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Update current network in context
            setCurrentNetwork(networkId as 'ethereum' | 'solana');
            
            // Notify parent component
            onNetworkChange?.(networkId);
            
        } catch (err) {
            console.error("Network switch failed:", err);
            setError(err instanceof Error ? err.message : "Failed to switch network");
        } finally {
            setSwitching(false);
        }
    };

    return (
        <div className={cn("relative", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="outline" 
                        className={cn(
                            "gap-2 min-w-[140px] justify-between",
                            currentNetworkData.bgColor,
                            switching && "opacity-75"
                        )}
                        disabled={switching}
                    >
                        <div className="flex items-center gap-2">
                            <span className={cn("text-lg", currentNetworkData.color)}>
                                {currentNetworkData.icon}
                            </span>
                            <span className="font-medium">{currentNetworkData.shortName}</span>
                        </div>
                        {switching ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Zap className="h-4 w-4" />
                            </motion.div>
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <span>Select Network</span>
                        {switching && (
                            <Badge variant="secondary" className="text-xs">
                                Switching...
                            </Badge>
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {SUPPORTED_NETWORKS.map((network) => {
                        const status = getNetworkStatus(network.id);
                        const isActive = network.id === currentNetwork;

                        return (
                            <DropdownMenuItem
                                key={network.id}
                                onClick={() => handleNetworkSwitch(network.id)}
                                className={cn(
                                    "flex flex-col items-start gap-2 p-4 cursor-pointer",
                                    isActive && "bg-blue-50 dark:bg-blue-900/20"
                                )}
                                disabled={switching}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-lg",
                                            network.bgColor
                                        )}>
                                            <span className={network.color}>{network.icon}</span>
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {network.name}
                                                {isActive && (
                                                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {network.description}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge 
                                            variant={status.isConnected ? "default" : "secondary"}
                                            className={cn(
                                                "text-xs",
                                                status.isConnected 
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                            )}
                                        >
                                            {status.isConnected ? "Connected" : "Not Connected"}
                                        </Badge>
                                        {network.isMainnet && (
                                            <Badge variant="outline" className="text-xs">
                                                Mainnet
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Connection Details */}
                                {status.isConnected && status.address && (
                                    <div className="w-full mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-400">Address:</span>
                                            <code className="font-mono">{status.address.slice(0, 8)}...{status.address.slice(-6)}</code>
                                        </div>
                                        {status.balance && (
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-slate-600 dark:text-slate-400">Balance:</span>
                                                <span>{parseFloat(status.balance).toFixed(4)} {network.shortName === "Ethereum" ? "ETH" : "SOL"}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Network Features */}
                                {showNetworkInfo && (
                                    <div className="w-full mt-2">
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Features:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {network.features.map((feature) => (
                                                <Badge 
                                                    key={feature} 
                                                    variant="outline" 
                                                    className="text-xs py-0 px-1"
                                                >
                                                    {feature}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </DropdownMenuItem>
                        );
                    })}

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-slate-200 dark:border-slate-700"
                            >
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 m-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                                        <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <DropdownMenuSeparator />
                    
                    {/* Network Info Footer */}
                    <div className="p-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1 mb-1">
                            <Zap className="h-3 w-3" />
                            <span>Powered by Web3Auth multi-chain support</span>
                        </div>
                        <p>Switch seamlessly between Ethereum and Solana networks</p>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};