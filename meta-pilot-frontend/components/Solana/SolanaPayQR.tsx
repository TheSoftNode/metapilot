"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Copy, Check, Download, Share2, Wallet, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// QR Code library (you'll need to install this)
// npm install qrcode @types/qrcode
import QRCode from "qrcode";

interface SolanaPayRequest {
    recipient: string;
    amount?: number;
    splToken?: string;
    reference?: string;
    label?: string;
    message?: string;
    memo?: string;
}

interface SolanaPayQRProps {
    className?: string;
    defaultRecipient?: string;
    onPaymentRequest?: (request: SolanaPayRequest) => void;
}

const POPULAR_TOKENS = [
    { symbol: "SOL", mint: null, name: "Solana", decimals: 9 },
    { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", name: "USD Coin", decimals: 6 },
    { symbol: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", name: "Tether USD", decimals: 6 },
    { symbol: "RAY", mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", name: "Raydium", decimals: 6 },
    { symbol: "SRM", mint: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt", name: "Serum", decimals: 6 },
];

export const SolanaPayQR: React.FC<SolanaPayQRProps> = ({ 
    className, 
    defaultRecipient, 
    onPaymentRequest 
}) => {
    const [recipient, setRecipient] = useState(defaultRecipient || "");
    const [amount, setAmount] = useState("");
    const [selectedToken, setSelectedToken] = useState("SOL");
    const [label, setLabel] = useState("");
    const [message, setMessage] = useState("");
    const [memo, setMemo] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const qrRef = useRef<HTMLCanvasElement>(null);
    const { solana } = useMultiChainWallet();

    // Validate Solana address
    const isValidSolanaAddress = (address: string): boolean => {
        try {
            new PublicKey(address);
            return true;
        } catch {
            return false;
        }
    };

    // Generate payment URL
    const generatePaymentUrl = (request: SolanaPayRequest): string => {
        const url = new URL(`solana:${request.recipient}`);
        
        if (request.amount) {
            url.searchParams.set('amount', request.amount.toString());
        }
        
        if (request.splToken) {
            url.searchParams.set('spl-token', request.splToken);
        }
        
        if (request.reference) {
            url.searchParams.set('reference', request.reference);
        }
        
        if (request.label) {
            url.searchParams.set('label', encodeURIComponent(request.label));
        }
        
        if (request.message) {
            url.searchParams.set('message', encodeURIComponent(request.message));
        }
        
        if (request.memo) {
            url.searchParams.set('memo', encodeURIComponent(request.memo));
        }
        
        return url.toString();
    };

    // Generate QR code
    const generateQRCode = async () => {
        if (!recipient.trim()) {
            setError("Recipient address is required");
            return;
        }

        if (!isValidSolanaAddress(recipient)) {
            setError("Invalid Solana address");
            return;
        }

        if (amount && isNaN(Number(amount))) {
            setError("Invalid amount");
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const selectedTokenData = POPULAR_TOKENS.find(t => t.symbol === selectedToken);
            
            const request: SolanaPayRequest = {
                recipient,
                amount: amount ? Number(amount) : undefined,
                splToken: selectedTokenData?.mint || undefined,
                reference: `metapilot-${Date.now()}`, // Generate unique reference
                label: label || "MetaPilot Payment",
                message: message || undefined,
                memo: memo || undefined,
            };

            const paymentUrlStr = generatePaymentUrl(request);
            setPaymentUrl(paymentUrlStr);

            // Generate QR code
            const qrCodeDataUrl = await QRCode.toDataURL(paymentUrlStr, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });

            setQrCodeUrl(qrCodeDataUrl);
            onPaymentRequest?.(request);

        } catch (err) {
            console.error("QR generation error:", err);
            setError("Failed to generate QR code");
        } finally {
            setGenerating(false);
        }
    };

    // Copy payment URL
    const handleCopy = async () => {
        if (paymentUrl) {
            await navigator.clipboard.writeText(paymentUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Download QR code
    const handleDownload = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.download = `solana-pay-qr-${Date.now()}.png`;
            link.href = qrCodeUrl;
            link.click();
        }
    };

    // Share functionality
    const handleShare = async () => {
        if (navigator.share && paymentUrl) {
            try {
                await navigator.share({
                    title: 'Solana Pay Request',
                    text: message || 'Payment request via Solana Pay',
                    url: paymentUrl,
                });
            } catch (err) {
                // Fallback to copy
                handleCopy();
            }
        } else {
            handleCopy();
        }
    };

    // Auto-fill current wallet address
    const useCurrentWallet = () => {
        if (solana.address) {
            setRecipient(solana.address);
        }
    };

    return (
        <Card className={cn("w-full max-w-lg", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Solana Pay QR Generator
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Create QR codes for Solana payments and transfers
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Recipient Address */}
                <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <div className="flex gap-2">
                        <Input
                            id="recipient"
                            placeholder="Solana wallet address..."
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className={cn(
                                "font-mono text-sm",
                                recipient && !isValidSolanaAddress(recipient) && "border-red-500"
                            )}
                        />
                        {solana.isConnected && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={useCurrentWallet}
                                title="Use connected wallet"
                            >
                                <Wallet className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {recipient && !isValidSolanaAddress(recipient) && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            Invalid Solana address format
                        </p>
                    )}
                </div>

                {/* Amount and Token */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (Optional)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.000001"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="token">Token</Label>
                        <Select value={selectedToken} onValueChange={setSelectedToken}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {POPULAR_TOKENS.map((token) => (
                                    <SelectItem key={token.symbol} value={token.symbol}>
                                        <div className="flex items-center gap-2">
                                            <span>{token.symbol}</span>
                                            <span className="text-xs text-slate-500">
                                                {token.name}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Label and Message */}
                <div className="space-y-2">
                    <Label htmlFor="label">Label (Optional)</Label>
                    <Input
                        id="label"
                        placeholder="Payment description..."
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                        id="message"
                        placeholder="Additional message for the recipient..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={2}
                    />
                </div>

                {/* Generate Button */}
                <Button
                    onClick={generateQRCode}
                    disabled={!recipient || generating || !isValidSolanaAddress(recipient)}
                    className="w-full"
                >
                    {generating ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mr-2"
                            >
                                <QrCode className="h-4 w-4" />
                            </motion.div>
                            Generating QR Code...
                        </>
                    ) : (
                        <>
                            <QrCode className="mr-2 h-4 w-4" />
                            Generate QR Code
                        </>
                    )}
                </Button>

                {/* Error */}
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

                {/* Generated QR Code */}
                <AnimatePresence>
                    {qrCodeUrl && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="space-y-4"
                        >
                            {/* QR Code Display */}
                            <div className="flex justify-center p-4 bg-white rounded-lg border">
                                <img 
                                    src={qrCodeUrl} 
                                    alt="Solana Pay QR Code"
                                    className="w-64 h-64"
                                />
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                        <span className="mr-1">◎</span>
                                        Solana Pay
                                    </Badge>
                                    <Badge variant="outline">
                                        {selectedToken}
                                    </Badge>
                                </div>
                                
                                <div className="text-sm space-y-1">
                                    <div><strong>Recipient:</strong> {recipient.slice(0, 8)}...{recipient.slice(-8)}</div>
                                    {amount && <div><strong>Amount:</strong> {amount} {selectedToken}</div>}
                                    {label && <div><strong>Label:</strong> {label}</div>}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="flex-1"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4 text-green-600" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy URL
                                        </>
                                    )}
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownload}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-medium mb-1">How to use:</p>
                                    <ul className="text-xs space-y-1 ml-4 list-disc">
                                        <li>Scan with any Solana Pay compatible wallet</li>
                                        <li>Share the QR code or URL with the sender</li>
                                        <li>Payment will be processed on the Solana blockchain</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};