"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ExternalLink, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";

interface TokenBalance {
    symbol: string;
    name: string;
    balance: number;
    decimals: number;
    usdValue?: number;
    change24h?: number;
    icon?: string;
    contractAddress?: string;
}

interface ChainPortfolio {
    chainName: string;
    chainIcon: string;
    nativeToken: TokenBalance;
    tokens: TokenBalance[];
    totalUsdValue: number;
    isConnected: boolean;
    address?: string;
}

interface MultiChainPortfolioProps {
    className?: string;
    showPrivateMode?: boolean;
}

export const MultiChainPortfolio: React.FC<MultiChainPortfolioProps> = ({ 
    className, 
    showPrivateMode = true 
}) => {
    const [loading, setLoading] = useState(false);
    const [portfolios, setPortfolios] = useState<ChainPortfolio[]>([]);
    const [isPrivateMode, setIsPrivateMode] = useState(false);
    const [selectedChain, setSelectedChain] = useState<'all' | 'ethereum' | 'solana'>('all');
    
    const { ethereum, solana, isConnected } = useMultiChainWallet();

    // Mock price data (in production, you'd fetch from CoinGecko, Jupiter, etc.)
    const mockPrices = {
        ETH: { usd: 3420, change24h: 2.5 },
        SOL: { usd: 198, change24h: -1.2 },
        USDC: { usd: 1.00, change24h: 0.1 },
        USDT: { usd: 0.999, change24h: -0.05 },
        WETH: { usd: 3420, change24h: 2.5 },
        RAY: { usd: 2.45, change24h: 5.8 },
        SRM: { usd: 0.98, change24h: -3.2 },
    };

    // Mock token balances (in production, you'd fetch from RPC/APIs)
    const getMockEthereumPortfolio = (): ChainPortfolio => {
        const ethBalance = ethereum.balance ? parseFloat(ethereum.balance) : 0;
        const ethPrice = mockPrices.ETH;
        
        return {
            chainName: "Ethereum",
            chainIcon: "Ξ",
            nativeToken: {
                symbol: "ETH",
                name: "Ethereum",
                balance: ethBalance,
                decimals: 18,
                usdValue: ethBalance * ethPrice.usd,
                change24h: ethPrice.change24h,
            },
            tokens: [
                {
                    symbol: "USDC",
                    name: "USD Coin",
                    balance: 1250.50,
                    decimals: 6,
                    usdValue: 1250.50 * mockPrices.USDC.usd,
                    change24h: mockPrices.USDC.change24h,
                    contractAddress: "0xA0b86a33E6Ee4c0B91C7Bdd8f31A8Fa0CA2cC1F3",
                },
                {
                    symbol: "WETH",
                    name: "Wrapped Ethereum",
                    balance: 0.5,
                    decimals: 18,
                    usdValue: 0.5 * mockPrices.WETH.usd,
                    change24h: mockPrices.WETH.change24h,
                    contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                }
            ],
            totalUsdValue: (ethBalance * ethPrice.usd) + (1250.50 * mockPrices.USDC.usd) + (0.5 * mockPrices.WETH.usd),
            isConnected: ethereum.isConnected,
            address: ethereum.address,
        };
    };

    const getMockSolanaPortfolio = (): ChainPortfolio => {
        const solBalance = solana.balance || 0;
        const solPrice = mockPrices.SOL;
        
        return {
            chainName: "Solana",
            chainIcon: "◎",
            nativeToken: {
                symbol: "SOL",
                name: "Solana",
                balance: solBalance,
                decimals: 9,
                usdValue: solBalance * solPrice.usd,
                change24h: solPrice.change24h,
            },
            tokens: [
                {
                    symbol: "USDC",
                    name: "USD Coin (Solana)",
                    balance: 2800.25,
                    decimals: 6,
                    usdValue: 2800.25 * mockPrices.USDC.usd,
                    change24h: mockPrices.USDC.change24h,
                    contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                },
                {
                    symbol: "RAY",
                    name: "Raydium",
                    balance: 150.75,
                    decimals: 6,
                    usdValue: 150.75 * mockPrices.RAY.usd,
                    change24h: mockPrices.RAY.change24h,
                    contractAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
                },
                {
                    symbol: "SRM",
                    name: "Serum",
                    balance: 75.0,
                    decimals: 6,
                    usdValue: 75.0 * mockPrices.SRM.usd,
                    change24h: mockPrices.SRM.change24h,
                    contractAddress: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
                }
            ],
            totalUsdValue: (solBalance * solPrice.usd) + (2800.25 * mockPrices.USDC.usd) + (150.75 * mockPrices.RAY.usd) + (75.0 * mockPrices.SRM.usd),
            isConnected: solana.isConnected,
            address: solana.address,
        };
    };

    // Load portfolio data
    const loadPortfolios = async () => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const portfolioData = [
                getMockEthereumPortfolio(),
                getMockSolanaPortfolio(),
            ];
            
            setPortfolios(portfolioData);
        } catch (error) {
            console.error("Failed to load portfolios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            loadPortfolios();
        }
    }, [isConnected, ethereum.isConnected, solana.isConnected]);

    // Calculate total portfolio value
    const totalPortfolioValue = portfolios.reduce((sum, portfolio) => sum + portfolio.totalUsdValue, 0);

    // Format currency
    const formatCurrency = (value: number, decimals: number = 2): string => {
        if (isPrivateMode) return "***";
        return `$${value.toLocaleString(undefined, { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
        })}`;
    };

    // Format token amount
    const formatTokenAmount = (amount: number, decimals: number = 6): string => {
        if (isPrivateMode) return "***";
        return amount.toLocaleString(undefined, { 
            minimumFractionDigits: Math.min(decimals, 6), 
            maximumFractionDigits: Math.min(decimals, 6) 
        });
    };

    // Filter portfolios based on selection
    const filteredPortfolios = portfolios.filter(portfolio => {
        if (selectedChain === 'all') return true;
        if (selectedChain === 'ethereum') return portfolio.chainName === 'Ethereum';
        if (selectedChain === 'solana') return portfolio.chainName === 'Solana';
        return true;
    });

    if (!isConnected) {
        return (
            <Card className={cn("w-full", className)}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Wallet className="h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Connect Your Wallet
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        Connect your Web3 wallet to view your multi-chain portfolio
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Portfolio Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Multi-Chain Portfolio
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Your assets across Ethereum and Solana
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {showPrivateMode && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsPrivateMode(!isPrivateMode)}
                                    className="h-8 w-8"
                                >
                                    {isPrivateMode ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={loadPortfolios}
                                disabled={loading}
                                className="h-8 w-8"
                            >
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(totalPortfolioValue)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Total Portfolio Value
                    </p>
                </CardContent>
            </Card>

            {/* Chain Filter Tabs */}
            <Tabs value={selectedChain} onValueChange={(value) => setSelectedChain(value as typeof selectedChain)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All Chains</TabsTrigger>
                    <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
                    <TabsTrigger value="solana">Solana</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedChain} className="mt-6">
                    <div className="space-y-4">
                        {filteredPortfolios.map((portfolio, index) => (
                            <motion.div
                                key={portfolio.chainName}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{portfolio.chainIcon}</span>
                                                    <div>
                                                        <h3 className="font-semibold">{portfolio.chainName}</h3>
                                                        {portfolio.address && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                {portfolio.address.slice(0, 8)}...{portfolio.address.slice(-6)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold">
                                                    {formatCurrency(portfolio.totalUsdValue)}
                                                </div>
                                                <Badge 
                                                    variant={portfolio.isConnected ? "default" : "secondary"}
                                                    className={cn(
                                                        "text-xs",
                                                        portfolio.isConnected 
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                    )}
                                                >
                                                    {portfolio.isConnected ? "Connected" : "Disconnected"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {/* Native Token */}
                                            <TokenRow 
                                                token={portfolio.nativeToken} 
                                                isPrivate={isPrivateMode}
                                                formatCurrency={formatCurrency}
                                                formatTokenAmount={formatTokenAmount}
                                            />
                                            
                                            {/* Other Tokens */}
                                            {portfolio.tokens.map((token) => (
                                                <TokenRow 
                                                    key={token.symbol + token.contractAddress}
                                                    token={token} 
                                                    isPrivate={isPrivateMode}
                                                    formatCurrency={formatCurrency}
                                                    formatTokenAmount={formatTokenAmount}
                                                />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Token Row Component
interface TokenRowProps {
    token: TokenBalance;
    isPrivate: boolean;
    formatCurrency: (value: number) => string;
    formatTokenAmount: (amount: number, decimals?: number) => string;
}

const TokenRow: React.FC<TokenRowProps> = ({ token, isPrivate, formatCurrency, formatTokenAmount }) => {
    const isPositiveChange = (token.change24h || 0) >= 0;
    
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-sm font-semibold">{token.symbol.slice(0, 2)}</span>
                </div>
                <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{token.name}</div>
                </div>
            </div>
            
            <div className="text-right">
                <div className="font-medium">
                    {formatTokenAmount(token.balance, 4)} {token.symbol}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    {token.usdValue && (
                        <span className="text-slate-600 dark:text-slate-400">
                            {formatCurrency(token.usdValue)}
                        </span>
                    )}
                    {token.change24h !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1",
                            isPositiveChange ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {isPositiveChange ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            <span>{isPrivate ? "***" : `${Math.abs(token.change24h).toFixed(1)}%`}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};