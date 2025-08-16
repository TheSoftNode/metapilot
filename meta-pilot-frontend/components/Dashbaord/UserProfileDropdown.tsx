"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    User,
    Settings,
    HelpCircle,
    LogOut,
    CreditCard,
    History,
    Shield,
    ExternalLink,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { useWeb3AuthContext } from "@/components/Providers/web3auth-provider";
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const UserProfileDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);
    const { address } = useWallet();
    const { getUserInfo, disconnect, isConnected } = useWeb3AuthContext();
    const { primaryAddress, currentNetwork } = useMultiChainWallet();
    const router = useRouter();

    // Get user info from Web3Auth
    useEffect(() => {
        if (isConnected) {
            const info = getUserInfo();
            setUserInfo(info);
        }
    }, [isConnected, getUserInfo]);

    // Generate user object from Web3Auth data or fallback
    const user = {
        name: userInfo?.name || "User",
        email: userInfo?.email || "user@example.com",
        walletAddress: primaryAddress || address,
        avatarUrl: userInfo?.profileImage || "",
        isPremium: true, // You can determine this based on your logic
        joinDate: new Date("2023-07-15"),
        typeOfLogin: userInfo?.typeOfLogin,
        verifier: userInfo?.verifier,
    };

    // Generate initials if no avatar
    const getInitials = () => {
        if (userInfo?.name) {
            return userInfo.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
        }
        if (userInfo?.email) {
            return userInfo.email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Helper to truncate ETH addresses
    const truncateAddress = (address: string): string => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyAddressToClipboard = () => {
        navigator.clipboard.writeText(user.walletAddress ?? "");
        setCopied(true);

        // Reset the copied state after 2 seconds
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await disconnect();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Get login method badge
    const getLoginMethodBadge = () => {
        if (userInfo?.typeOfLogin) {
            return userInfo.typeOfLogin.charAt(0).toUpperCase() + userInfo.typeOfLogin.slice(1);
        }
        return 'Wallet';
    };

    // Get network badge
    const getNetworkInfo = () => {
        return currentNetwork === 'solana' 
            ? { name: 'Solana', icon: '◎', color: 'from-purple-500 to-pink-500' }
            : { name: 'Ethereum', icon: 'Ξ', color: 'from-blue-500 to-indigo-500' };
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full border dark:bg-slate-900/90 border-indigo-100 dark:border-indigo-900/30 shadow-lg"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {getInitials()}
                        </AvatarFallback>
                    </Avatar>
                    {user.isPremium && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white dark:border-[#040d36]"></span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-72 p-0 shadow-lg"
                forceMount
            >
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="dark:bg-slate-900/90 border-indigo-100 dark:border-indigo-900/30 shadow-lg"
                >
                    {/* User info header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback className="text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate mr-2">
                                        {user.name}
                                    </p>
                                    <Badge className="h-5 px-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                        {getLoginMethodBadge()}
                                    </Badge>
                                    {user.isPremium && (
                                        <Badge className="h-5 px-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white ml-1">
                                            Pro
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {/* Wallet address */}
                        <div
                            className={cn(
                                "mt-3 flex items-center rounded-md px-3 py-1.5 cursor-pointer transition-colors",
                                copied
                                    ? "bg-green-100 dark:bg-green-900/30"
                                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                            onClick={copyAddressToClipboard}
                        >
                            <p className="text-xs font-mono tracking-tight text-slate-700 dark:text-slate-300">
                                {truncateAddress(user?.walletAddress ?? "")}
                            </p>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "ml-auto text-[10px] h-4 px-1 transition-all",
                                    copied
                                        ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400"
                                        : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"
                                )}
                            >
                                {copied ? "Copied!" : "Click to copy"}
                            </Badge>
                        </div>
                    </div>

                    {/* Menu items */}
                    <DropdownMenuGroup className="p-2">
                        <DropdownMenuItem asChild className="h-9 cursor-pointer">
                            <Link href="/dashboard/profile" className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Profile</span>
                                <ChevronRight className="ml-auto h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="h-9 cursor-pointer">
                            <Link href="/dashboard/billing" className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Billing & Plans</span>
                                <ChevronRight className="ml-auto h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="h-9 cursor-pointer">
                            <Link href="/dashboard/history" className="flex items-center">
                                <History className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Transaction History</span>
                                <ChevronRight className="ml-auto h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="h-9 cursor-pointer">
                            <Link href="/dashboard/security" className="flex items-center">
                                <Shield className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Security</span>
                                <ChevronRight className="ml-auto h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup className="p-2">
                        <DropdownMenuItem asChild className="h-9 cursor-pointer">
                            <Link href="/dashboard/settings" className="flex items-center">
                                <Settings className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Settings</span>
                                <ChevronRight className="ml-auto h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="h-9 cursor-pointer">
                            <Link href="/dashboard/help" className="flex items-center">
                                <HelpCircle className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Help & Support</span>
                                <ChevronRight className="ml-auto h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="h-9 cursor-pointer">
                            <a
                                href="/docs"
                                // target="_blank"
                                // rel="noopener noreferrer"
                                className="flex items-center"
                            >
                                <ExternalLink className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <span>Documentation</span>
                                <ExternalLink className="ml-auto h-3 w-3 text-slate-500 dark:text-slate-400" />
                            </a>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* Logout */}
                    <div className="p-2">
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full justify-start h-9 px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-700 dark:hover:text-red-300"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log Out</span>
                        </Button>
                    </div>
                </motion.div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserProfileDropdown;