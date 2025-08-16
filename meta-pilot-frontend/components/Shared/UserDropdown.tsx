"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, User, LogOut, LayoutDashboard, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWeb3AuthContext } from "@/components/Providers/web3auth-provider";
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";
import { useRouter } from "next/navigation";

interface UserInfo {
    email?: string;
    name?: string;
    profileImage?: string;
    verifier?: string;
    typeOfLogin?: string;
}

interface UserDropdownProps {
    className?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const { getUserInfo, disconnect, isConnected } = useWeb3AuthContext();
    const { primaryAddress, formatAddress, currentNetwork } = useMultiChainWallet();
    const router = useRouter();

    useEffect(() => {
        if (isConnected) {
            const info = getUserInfo();
            setUserInfo(info);
        } else {
            setUserInfo(null);
        }
    }, [isConnected, getUserInfo]);

    const handleDisconnect = async () => {
        await disconnect();
        setIsOpen(false);
        router.push('/');
    };

    const goToDashboard = () => {
        router.push('/dashboard');
        setIsOpen(false);
    };

    // Generate initials from name or email
    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Get display name
    const getDisplayName = () => {
        if (userInfo?.name) return userInfo.name;
        if (userInfo?.email) return userInfo.email.split('@')[0];
        if (primaryAddress) return formatAddress(primaryAddress);
        return 'User';
    };

    // Get connection type display
    const getConnectionType = () => {
        if (userInfo?.typeOfLogin) {
            return userInfo.typeOfLogin.charAt(0).toUpperCase() + userInfo.typeOfLogin.slice(1);
        }
        return 'Wallet';
    };

    // Get network badge
    const getNetworkBadge = () => {
        return currentNetwork === 'solana' 
            ? { name: 'Solana', icon: '◎', color: 'bg-purple-500' }
            : { name: 'Ethereum', icon: 'Ξ', color: 'bg-blue-500' };
    };

    if (!isConnected) return null;

    const network = getNetworkBadge();

    return (
        <div className={`relative ${className}`}>
            <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Avatar className="h-8 w-8">
                    <AvatarImage src={userInfo?.profileImage} alt={getDisplayName()} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                        {getInitials(userInfo?.name, userInfo?.email)}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
                        {getDisplayName()}
                    </span>
                    <div className="flex items-center space-x-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${network.color}`}></span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {network.name}
                        </span>
                    </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Dropdown Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                        >
                            {/* User Info Section */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={userInfo?.profileImage} alt={getDisplayName()} />
                                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                            {getInitials(userInfo?.name, userInfo?.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                            {getDisplayName()}
                                        </h4>
                                        {userInfo?.email && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {userInfo.email}
                                            </p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                                {getConnectionType()}
                                            </span>
                                            <div className="flex items-center space-x-1">
                                                <span className={`inline-block w-2 h-2 rounded-full ${network.color}`}></span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {network.icon} {network.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Address Display */}
                                {primaryAddress && (
                                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Wallet className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs text-gray-600 dark:text-gray-300">Address</span>
                                            </div>
                                            <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
                                                {formatAddress(primaryAddress)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                <button
                                    onClick={goToDashboard}
                                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </button>
                                
                                <button
                                    onClick={handleDisconnect}
                                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDropdown;