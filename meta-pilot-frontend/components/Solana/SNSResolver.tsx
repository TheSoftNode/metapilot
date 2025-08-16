"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";
import { Connection, PublicKey } from "@solana/web3.js";

interface SNSRecord {
    domain: string;
    address: string;
    isValid: boolean;
    metadata?: {
        avatar?: string;
        description?: string;
        twitter?: string;
        discord?: string;
        github?: string;
    };
}

interface SNSResolverProps {
    className?: string;
    onResolve?: (record: SNSRecord | null) => void;
}

export const SNSResolver: React.FC<SNSResolverProps> = ({ className, onResolve }) => {
    const [domain, setDomain] = useState("");
    const [resolving, setResolving] = useState(false);
    const [record, setRecord] = useState<SNSRecord | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    const { solana } = useMultiChainWallet();

    // Simulate SNS resolution (in production, you'd use @bonfida/spl-name-service)
    const resolveDomain = async (inputDomain: string): Promise<SNSRecord | null> => {
        if (!solana.connection) {
            throw new Error("Solana connection not available");
        }

        // Normalize domain
        const normalizedDomain = inputDomain.toLowerCase().endsWith('.sol') 
            ? inputDomain.toLowerCase() 
            : `${inputDomain.toLowerCase()}.sol`;

        // Simulate resolution delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock SNS records for demo purposes
        const mockRecords: Record<string, SNSRecord> = {
            "bonfida.sol": {
                domain: "bonfida.sol",
                address: "HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA",
                isValid: true,
                metadata: {
                    avatar: "/icons/bonfida-avatar.png",
                    description: "Bonfida - The flagship Solana dApp",
                    twitter: "@bonfida",
                    discord: "bonfida"
                }
            },
            "solana.sol": {
                domain: "solana.sol",
                address: "11111111111111111111111111111112",
                isValid: true,
                metadata: {
                    description: "Solana Foundation",
                    twitter: "@solana"
                }
            },
            "metapilot.sol": {
                domain: "metapilot.sol", 
                address: "MetaPiLoT1111111111111111111111111111111",
                isValid: true,
                metadata: {
                    description: "MetaPilot - Web3 Automation Platform",
                    twitter: "@metapilot"
                }
            }
        };

        const mockRecord = mockRecords[normalizedDomain];
        if (mockRecord) {
            return mockRecord;
        }

        // For other domains, return null (not found)
        return null;
    };

    const handleResolve = async () => {
        if (!domain.trim()) return;

        setResolving(true);
        setError(null);
        setRecord(null);

        try {
            const resolved = await resolveDomain(domain);
            setRecord(resolved);
            onResolve?.(resolved);
            
            if (!resolved) {
                setError(`Domain "${domain.endsWith('.sol') ? domain : domain + '.sol'}" not found`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to resolve domain";
            setError(errorMessage);
            setRecord(null);
            onResolve?.(null);
        } finally {
            setResolving(false);
        }
    };

    const handleCopyAddress = async () => {
        if (record?.address) {
            await navigator.clipboard.writeText(record.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleResolve();
        }
    };

    return (
        <Card className={cn("w-full max-w-md", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-purple-600 dark:text-purple-400">◎</span>
                    SNS Domain Resolver
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Resolve Solana Name Service domains to wallet addresses
                </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Domain Input */}
                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            placeholder="Enter domain (e.g., bonfida.sol)"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="pr-20"
                            disabled={resolving}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                            {!domain.endsWith('.sol') && domain && (
                                <span className="text-xs text-slate-400">.sol</span>
                            )}
                            <Button
                                size="sm"
                                onClick={handleResolve}
                                disabled={!domain.trim() || resolving}
                                className="h-7 w-7 p-0"
                            >
                                {resolving ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Search className="h-3 w-3" />
                                    </motion.div>
                                ) : (
                                    <Search className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                    </motion.div>
                )}

                {/* Resolved Record */}
                {record && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        {/* Domain Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                    <span className="mr-1">◎</span>
                                    {record.domain}
                                </Badge>
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                    <Check className="h-3 w-3 mr-1" />
                                    Verified
                                </Badge>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                Solana Address
                            </label>
                            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                                    {record.address}
                                </code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCopyAddress}
                                    className="h-6 w-6 p-0"
                                >
                                    {copied ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(`https://solscan.io/account/${record.address}`, '_blank')}
                                    className="h-6 w-6 p-0"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Metadata */}
                        {record.metadata && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    Profile Information
                                </label>
                                <div className="space-y-2">
                                    {record.metadata.description && (
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            {record.metadata.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {record.metadata.twitter && (
                                            <Badge variant="outline" className="text-blue-600">
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                {record.metadata.twitter}
                                            </Badge>
                                        )}
                                        {record.metadata.discord && (
                                            <Badge variant="outline" className="text-indigo-600">
                                                Discord: {record.metadata.discord}
                                            </Badge>
                                        )}
                                        {record.metadata.github && (
                                            <Badge variant="outline" className="text-gray-600">
                                                GitHub: {record.metadata.github}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Quick Examples */}
                {!record && !error && !resolving && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Try these examples:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["bonfida.sol", "solana.sol", "metapilot.sol"].map((example) => (
                                <Button
                                    key={example}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDomain(example)}
                                    className="text-xs h-7"
                                >
                                    {example}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};