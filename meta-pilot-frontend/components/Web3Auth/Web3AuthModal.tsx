"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, AlertCircle, Loader2, Mail, Smartphone, Github, Apple, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";
import MetaPilotLogo from "@/components/Shared/MetaPilotLogo";

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
);

const TwitterIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#1DA1F2" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
);

const GitHubIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);

const AppleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
);

const MetaMaskIcon = () => (
    <div className="relative">
        <svg viewBox="0 0 40 40" className="h-8 w-8">
            <path fill="#E17726" d="M37.9 2.3L23.5 12.8l2.7-6.2L37.9 2.3z"/>
            <path fill="#E27625" d="M2.2 2.3l14.2 10.6-2.5-6.3L2.2 2.3zM32.4 28.8l-3.9 5.8 8.3 2.3 2.4-7.9-6.8-.2zM1.1 29l2.4 7.9 8.3-2.3-3.9-5.8L1.1 29z"/>
            <path fill="#E27625" d="M10.7 17.2L8.6 20.6l8.2.4-.3-8.7-5.8 5zM29.4 17.2l-6-5.2-.2 8.9 8.2-.4-2-3.3z"/>
            <path fill="#E27625" d="M11.8 34.6l5-2.4-4.3-3.3-.7 5.7zM23.3 32.2l5 2.4-.7-5.7-4.3 3.3z"/>
        </svg>
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border border-white dark:border-gray-900"></div>
    </div>
);

const WalletConnectIcon = () => (
    <svg viewBox="0 0 40 40" className="h-8 w-8">
        <path fill="#3B99FC" d="M8.68 15.68c7.61-7.45 19.95-7.45 27.55 0l.92.9c.38.37.38.97 0 1.34l-3.14 3.07c-.19.18-.5.18-.69 0l-1.26-1.23c-5.31-5.19-13.91-5.19-19.22 0l-1.35 1.32c-.19.18-.5.18-.69 0L7.66 17.9c-.38-.37-.38-.97 0-1.34l1.02-.99z"/>
        <path fill="#3B99FC" d="M35.44 22.86l2.8 2.74c.38.37.38.97 0 1.34l-12.6 12.32c-.38.37-.99.37-1.37 0l-8.95-8.75c-.09-.09-.25-.09-.34 0l-8.95 8.75c-.38.37-.99.37-1.37 0L1.76 26.94c-.38-.37-.38-.97 0-1.34l2.8-2.74c.38-.37.99-.37 1.37 0l8.95 8.75c.09.09.25.09.34 0l8.95-8.75c.38-.37.99-.37 1.37 0l8.95 8.75c.09.09.25.09.34 0l8.95-8.75c.38-.37.99-.37 1.37 0z"/>
    </svg>
);

const CoinbaseIcon = () => (
    <svg viewBox="0 0 40 40" className="h-8 w-8">
        <path fill="#0052FF" d="M20 40C8.95 40 0 31.05 0 20S8.95 0 20 0s20 8.95 20 20-8.95 20-20 20zm0-33c-7.18 0-13 5.82-13 13s5.82 13 13 13 13-5.82 13-13-5.82-13-13-13z"/>
        <path fill="#0052FF" d="M15 16h10v8H15z"/>
    </svg>
);

const PhantomIcon = () => (
    <svg viewBox="0 0 40 40" className="h-8 w-8">
        <path fill="#AB9FF2" d="M35.8 15.8c0-8.8-7.1-15.8-15.8-15.8S4.2 7.1 4.2 15.8c0 6.9 4.4 12.8 10.5 14.9v-3.4c-4.4-1.8-7.5-6.1-7.5-11.2 0-6.7 5.4-12.1 12.1-12.1s12.1 5.4 12.1 12.1c0 5.1-3.1 9.4-7.5 11.2v3.4c6.1-2.1 10.5-8 10.5-14.9z"/>
        <circle fill="#AB9FF2" cx="14" cy="15" r="2"/>
        <circle fill="#AB9FF2" cx="26" cy="15" r="2"/>
    </svg>
);

type ConnectionStatus = "idle" | "connecting" | "success" | "error";
type AuthMethod = "social" | "email" | "sms" | "wallet";

interface Web3AuthModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const socialProviders = [
    { id: "google", name: "Google", icon: GoogleIcon, color: "hover:bg-blue-50 dark:hover:bg-blue-900/20" },
    { id: "facebook", name: "Facebook", icon: FacebookIcon, color: "hover:bg-blue-50 dark:hover:bg-blue-900/20" },
    { id: "twitter", name: "Twitter", icon: TwitterIcon, color: "hover:bg-sky-50 dark:hover:bg-sky-900/20" },
    { id: "discord", name: "Discord", icon: DiscordIcon, color: "hover:bg-indigo-50 dark:hover:bg-indigo-900/20" },
    { id: "linkedin", name: "LinkedIn", icon: LinkedInIcon, color: "hover:bg-blue-50 dark:hover:bg-blue-900/20" },
    { id: "github", name: "GitHub", icon: GitHubIcon, color: "hover:bg-gray-50 dark:hover:bg-gray-900/20" },
    { id: "apple", name: "Apple", icon: AppleIcon, color: "hover:bg-gray-50 dark:hover:bg-gray-900/20" },
];

const walletProviders = [
    { 
        id: "metamask", 
        name: "MetaMask", 
        icon: MetaMaskIcon, 
        badge: "Popular",
        badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        description: "Connect using browser extension"
    },
    { 
        id: "walletconnect", 
        name: "WalletConnect", 
        icon: WalletConnectIcon, 
        badge: "250+ Wallets",
        badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        description: "Scan with mobile wallet"
    },
    { 
        id: "coinbase", 
        name: "Coinbase Wallet", 
        icon: CoinbaseIcon, 
        badge: "Smart Wallet",
        badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        description: "Connect with Coinbase"
    },
    { 
        id: "phantom", 
        name: "Phantom", 
        icon: PhantomIcon, 
        badge: "Solana",
        badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        description: "Multi-chain Solana wallet"
    },
];

export const Web3AuthModal: React.FC<Web3AuthModalProps> = ({ open, onOpenChange }) => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
    const [authMethod, setAuthMethod] = useState<AuthMethod>("social");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [connectionError, setConnectionError] = useState<string | null>(null);
    
    const router = useRouter();
    
    // Use real Web3Auth functions
    const { 
        handleSocialAuth, 
        handleEmailAuth, 
        handleSmsAuth,
        handleWalletConnect,
        isConnected,
        isConnecting,
        isInitialized,
        error,
        userInfo
    } = useMultiChainWallet();

    // Real social authentication
    const handleSocialAuthClick = async (provider: string) => {
        try {
            setConnectionStatus("connecting");
            setConnectionError(null);
            
            await handleSocialAuth(provider);
            
            setConnectionStatus("success");
        } catch (error) {
            console.error(`${provider} authentication failed:`, error);
            setConnectionStatus("error");
            setConnectionError("Authentication failed. Please try again.");
        }
    };

    // Real email authentication
    const handleEmailAuthClick = async () => {
        if (!email.trim()) return;
        try {
            setConnectionStatus("connecting");
            setConnectionError(null);
            
            await handleEmailAuth(email);
            
            setConnectionStatus("success");
        } catch (error) {
            console.error("Email authentication failed:", error);
            setConnectionStatus("error");
            setConnectionError("Email authentication failed. Please try again.");
        }
    };

    // Real SMS authentication
    const handleSmsAuthClick = async () => {
        if (!phone.trim()) return;
        try {
            setConnectionStatus("connecting");
            setConnectionError(null);
            
            await handleSmsAuth(phone);
            
            setConnectionStatus("success");
        } catch (error) {
            console.error("SMS authentication failed:", error);
            setConnectionStatus("error");
            setConnectionError("SMS authentication failed. Please try again.");
        }
    };

    // Real wallet connection
    const handleWalletConnectClick = async (walletId: string) => {
        try {
            setConnectionStatus("connecting");
            setConnectionError(null);
            
            await handleWalletConnect(walletId);
            
            setConnectionStatus("success");
        } catch (error) {
            console.error(`${walletId} connection failed:`, error);
            setConnectionStatus("error");
            setConnectionError("Wallet connection failed. Please try again.");
        }
    };

    // Monitor connection state
    useEffect(() => {
        if (isConnecting) {
            setConnectionStatus("connecting");
        } else if (isConnected) {
            setConnectionStatus("success");
        } else if (error) {
            setConnectionStatus("error");
            setConnectionError(
                typeof error === "object" && error !== null && "message" in error
                    ? (error as { message: string }).message
                    : typeof error === "string"
                        ? error
                        : "Connection failed"
            );
        }
    }, [isConnecting, isConnected, error]);

    // Handle success redirect
    useEffect(() => {
        if (connectionStatus === "success" && isConnected) {
            setTimeout(() => {
                onOpenChange(false);
                router.push("/dashboard");
            }, 2000);
        }
    }, [connectionStatus, isConnected, onOpenChange, router]);

    const resetConnection = () => {
        setConnectionStatus("idle");
        setConnectionError(null);
    };

    const closeAndReset = (openState: boolean) => {
        if (!openState) {
            setTimeout(() => {
                setConnectionStatus("idle");
                setEmail("");
                setPhone("");
                setAuthMethod("social");
                setConnectionError(null);
            }, 300);
        }
        onOpenChange(openState);
    };

    return (
        <Dialog open={open} onOpenChange={closeAndReset}>
            <DialogContent className="sm:max-w-md lg:max-w-lg rounded-2xl border-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-8 pt-8 pb-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col items-center w-full">
                            <MetaPilotLogo className="h-8 mb-2" />
                            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                                Connect your account to start automating Web3 tasks
                            </p>
                        </div>
                       
                    </div>

                    {/* Method Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        {[
                            { id: "social", label: "Social", icon: MessageCircle },
                            { id: "email", label: "Email", icon: Mail },
                            { id: "sms", label: "SMS", icon: Smartphone },
                            { id: "wallet", label: "Wallet", icon: Smartphone },
                        ].map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setAuthMethod(method.id as AuthMethod)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                                    authMethod === method.id
                                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <method.icon className="h-4 w-4" />
                                {method.label}
                            </button>
                        ))}
                    </div>
                </DialogHeader>

                <div className="px-8 pb-8">
                    <AnimatePresence mode="wait">
                        {!isInitialized && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="mt-6 text-center"
                            >
                                <div className="flex items-center justify-center gap-3 py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Initializing Web3Auth...
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Status: {JSON.stringify(isInitialized)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {isInitialized && connectionStatus === "idle" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="mt-6"
                            >
                                {/* Social Authentication */}
                                {authMethod === "social" && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            {socialProviders.map((provider) => (
                                                <motion.button
                                                    key={provider.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleSocialAuthClick(provider.id)}
                                                    disabled={!isInitialized || isConnecting}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl transition-all",
                                                        "hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md",
                                                        !isInitialized || isConnecting ? "opacity-50 cursor-not-allowed" : provider.color
                                                    )}
                                                >
                                                    <provider.icon />
                                                    <span className="font-medium text-sm">{provider.name}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Email Authentication */}
                                {authMethod === "email" && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Email Address
                                            </label>
                                            <Input
                                                type="email"
                                                placeholder="Enter your email address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-12 px-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                                                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuthClick()}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleEmailAuthClick}
                                            disabled={!email.trim() || !isInitialized || isConnecting}
                                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            <Mail className="mr-2 h-4 w-4" />
                                            Continue with Email
                                        </Button>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                            We'll send you a secure login link via email
                                        </p>
                                    </div>
                                )}

                                {/* SMS Authentication */}
                                {authMethod === "sms" && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Phone Number
                                            </label>
                                            <Input
                                                type="tel"
                                                placeholder="+1-2125551234"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="h-12 px-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSmsAuthClick()}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleSmsAuthClick}
                                            disabled={!phone.trim() || !isInitialized || isConnecting}
                                            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            <Smartphone className="mr-2 h-4 w-4" />
                                            Continue with SMS
                                        </Button>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                            Format: +{"{country-code}"}-{"{number}"} (e.g., +1-2125551234 or +234-9038726950)
                                        </p>
                                    </div>
                                )}

                                {/* Wallet Authentication */}
                                {authMethod === "wallet" && (
                                    <div className="space-y-3">
                                        {walletProviders.map((wallet) => (
                                            <motion.button
                                                key={wallet.id}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => handleWalletConnectClick(wallet.id)}
                                                disabled={!isInitialized || isConnecting}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all",
                                                    !isInitialized || isConnecting ? "opacity-50 cursor-not-allowed" : ""
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <wallet.icon />
                                                    <div className="text-left">
                                                        <div className="font-medium text-sm">{wallet.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            {wallet.description}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    wallet.badgeColor
                                                )}>
                                                    {wallet.badge}
                                                </div>
                                            </motion.button>
                                        ))}

                                        <Button
                                            variant="outline"
                                            className="w-full mt-4 p-4 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                                            onClick={() => {/* Handle show more wallets */}}
                                        >
                                            <span className="text-sm font-medium">View More Wallets</span>
                                            <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                                                200+
                                            </span>
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {connectionStatus === "connecting" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center py-16"
                            >
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-ping"></div>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Connecting...</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-xs">
                                    Please approve the connection request in your wallet or complete the authentication
                                </p>
                            </motion.div>
                        )}

                        {connectionStatus === "success" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center py-16"
                            >
                                <motion.div
                                    className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-6"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.1 }}
                                >
                                    <Check className="h-8 w-8 text-white" />
                                </motion.div>
                                <h3 className="text-lg font-semibold mb-2">Welcome to MetaPilot!</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
                                    Connection successful. Redirecting to dashboard...
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Connected</span>
                                </div>
                            </motion.div>
                        )}

                        {connectionStatus === "error" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center py-16"
                            >
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center mb-6">
                                    <AlertCircle className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 max-w-xs">
                                    {connectionError || "Unable to establish connection. Please try again."}
                                </p>
                                <Button
                                    onClick={resetConnection}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg"
                                >
                                    Try Again
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer - only show when idle */}
                    {connectionStatus === "idle" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                <Shield className="h-4 w-4" />
                                <span className="font-medium">Secured Connection</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                By connecting, you agree to our{" "}
                                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium">
                                    Terms
                                </span>{" "}
                                &{" "}
                                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium">
                                    Privacy Policy
                                </span>
                            </p>
                        </motion.div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
