"use client";

import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Web3AuthModal } from "@/components/Web3Auth/Web3AuthModal";
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";
import UserDropdown from "@/components/Shared/UserDropdown";

interface WalletConnectButtonProps {
    buttonClass?: string;
    className?: string;
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ buttonClass, className }) => {
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const { isConnected } = useMultiChainWallet();

    return (
        <>
            {isConnected ? (
                <UserDropdown className={className} />
            ) : (
                <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn("inline-flex", className)}
                >
                    <Button
                        onClick={() => setShowDialog(true)}
                        className={`bg-blue-600 text-white font-medium py-3 px-8 ${buttonClass} rounded-full hover:bg-blue-700 transition-colors`}
                    >
                        <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                    </Button>
                </motion.div>
            )}

            <Web3AuthModal
                open={showDialog}
                onOpenChange={setShowDialog}
            />
        </>
    );
};

export default WalletConnectButton;

