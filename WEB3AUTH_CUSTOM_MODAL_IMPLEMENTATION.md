# **MetaPilot Web3Auth Custom Modal Implementation Guide**

## **Executive Summary**

This document provides a complete implementation strategy for integrating Web3Auth functionality into MetaPilot's existing custom modal design. The goal is to maintain the exact custom UI/UX while adding full Web3Auth capabilities including 15+ social logins, email authentication, and multi-chain wallet support (Ethereum + Solana).

## **Table of Contents**

1. [Current State Analysis](#current-state-analysis)
2. [Implementation Strategy](#implementation-strategy)
3. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
4. [Code Examples](#code-examples)
5. [Dependencies & Environment](#dependencies--environment)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Considerations](#deployment-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)

## **Current State Analysis**

### **Existing Components**
- **`Web3AuthModal.tsx`** - Beautiful custom modal with 3 tabs (Social, Email, Wallet) but uses mock functions
- **`WalletConnectButton.tsx`** - Triggers the modal and handles connection state
- **`WalletConnectDialog.tsx`** - Alternative wallet connection dialog using traditional Wagmi approach
- **`wallet-provider.tsx`** - Current Wagmi-based provider setup
- **`use-multi-chain-wallet.ts`** - Hook for multi-chain wallet state (currently mock)

### **Challenge Statement**
The existing `Web3AuthModal` has perfect UI/UX but lacks actual Web3Auth integration. We need to keep the exact custom design while adding full Web3Auth functionality without triggering Web3Auth's default modal.

### **Technical Requirements**
- Maintain existing modal design and animations
- Support 15+ social authentication providers
- Enable passwordless email authentication
- Provide multi-chain wallet support (Ethereum + Solana)
- Ensure SSR compatibility with Next.js
- Meet hackathon requirements for Web3Auth integration

## **Implementation Strategy**

### **Core Approach**
1. **Replace Provider Layer**: Switch from Wagmi-only to Web3Auth provider while maintaining existing UI
2. **Custom Authentication**: Use Web3Auth's `connectTo()` function with custom parameters
3. **Grouped Connections**: Implement grouped authentication for consistent wallet addresses
4. **Multi-Chain Support**: Leverage Web3Auth's cross-chain capabilities
5. **UI Preservation**: Keep existing modal components with real function integration

### **Key Web3Auth Features to Implement**
- **Social Authentication**: Google, Facebook, Twitter, Discord, LinkedIn, GitHub, Apple
- **Email Authentication**: Passwordless email login
- **Traditional Wallets**: MetaMask, WalletConnect, Coinbase, Phantom
- **Multi-Chain Derivation**: Single auth session for both ETH and SOL wallets
- **MFA Support**: Optional multi-factor authentication
- **User Profile**: Rich user information from social providers

## **Phase-by-Phase Implementation**

### **Phase 1: Web3Auth Provider Setup (Priority: Critical)**

#### **1.1: Create Web3Auth Provider Component**

**File**: `components/Providers/web3auth-provider.tsx` (NEW)

```typescript
"use client";

import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IWeb3AuthState, WEB3AUTH_NETWORK, WALLET_CONNECTORS } from "@web3auth/modal";
import { ReactNode } from "react";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!;
const queryClient = new QueryClient();

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // Production
    ssr: true, // Critical for Next.js
    modalConfig: {
      connectors: {
        [WALLET_CONNECTORS.AUTH]: {
          label: "auth",
          loginMethods: {
            google: {
              name: "google login",
              authConnectionId: "w3a-google",
              groupedAuthConnectionId: "aggregate-sapphire",
            },
            facebook: {
              name: "facebook login",
              authConnectionId: "w3a-facebook",
              groupedAuthConnectionId: "aggregate-sapphire"
            },
            twitter: {
              name: "twitter login",
              authConnectionId: "w3a-twitter",
              groupedAuthConnectionId: "aggregate-sapphire"
            },
            discord: {
              name: "discord login",
              authConnectionId: "w3a-discord",
              groupedAuthConnectionId: "aggregate-sapphire"
            },
            linkedin: {
              name: "linkedin login",
              authConnectionId: "w3a-linkedin",
              groupedAuthConnectionId: "aggregate-sapphire"
            },
            github: {
              name: "github login",
              authConnectionId: "w3a-github",
              groupedAuthConnectionId: "aggregate-sapphire"
            },
            apple: {
              name: "apple login",
              authConnectionId: "w3a-apple",
              groupedAuthConnectionId: "aggregate-sapphire"
            },
            email_passwordless: {
              name: "email passwordless login",
              authConnectionId: "w3a-email-passwordless",
              groupedAuthConnectionId: "aggregate-sapphire"
            },
          },
        },
        [WALLET_CONNECTORS.METAMASK]: {
          name: "MetaMask",
          showOnModal: true,
        },
        [WALLET_CONNECTORS.WALLETCONNECT]: {
          name: "WalletConnect",
          showOnModal: true,
        },
        [WALLET_CONNECTORS.COINBASE]: {
          name: "Coinbase Wallet",
          showOnModal: true,
        },
      },
    },
  }
};

export function Web3AuthProviderComponent({ 
  children, 
  web3authInitialState 
}: {
  children: ReactNode,
  web3authInitialState: IWeb3AuthState | undefined
}) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
```

#### **1.2: Update Root Layout for SSR Support**

**File**: `app/layout.tsx` (MODIFY)

```typescript
import { cookieToWeb3AuthState } from "@web3auth/modal";
import { headers } from "next/headers";
import { Web3AuthProviderComponent } from "@/components/Providers/web3auth-provider";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const web3authInitialState = cookieToWeb3AuthState(headersList.get('cookie'));
  
  return (
    <html lang="en">
      <body>
        <Web3AuthProviderComponent web3authInitialState={web3authInitialState}>
          {children}
        </Web3AuthProviderComponent>
      </body>
    </html>
  );
}
```

### **Phase 2: Enhanced Multi-Chain Hook (Priority: Critical)**

#### **2.1: Real Web3Auth Integration Hook**

**File**: `hooks/use-multi-chain-wallet.ts` (REPLACE)

```typescript
"use client";

import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser, useWeb3Auth } from "@web3auth/modal/react";
import { useAccount } from "wagmi"; // Ethereum
import { useSolanaWallet } from "@web3auth/modal/react/solana"; // Solana
import { WALLET_CONNECTORS, AUTH_CONNECTION } from "@web3auth/modal";
import { getED25519Key } from "@web3auth/modal";
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function useMultiChainWallet() {
  // Web3Auth hooks
  const { connectTo, isConnected, loading: connectLoading, error: connectError } = useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const { provider } = useWeb3Auth();
  
  // Ethereum wallet (Wagmi)
  const { address: ethAddress, isConnected: ethConnected } = useAccount();
  
  // Solana wallet
  const { accounts: solAccounts, connection: solConnection } = useSolanaWallet();
  
  // Local state
  const [solanaAddress, setSolanaAddress] = useState<string | undefined>();
  const [solanaBalance, setSolanaBalance] = useState<number>(0);
  const [ethereumBalance, setEthereumBalance] = useState<string>("0");
  
  // Derive Solana address from Ethereum private key
  useEffect(() => {
    const deriveSolanaAddress = async () => {
      if (provider && isConnected) {
        try {
          const ethPrivateKey = await provider.request({ method: "private_key" });
          const privateKey = getED25519Key(ethPrivateKey as string).sk.toString("hex");
          const secretKey = new Uint8Array(Buffer.from(privateKey, 'hex'));
          const keypair = Keypair.fromSecretKey(secretKey);
          setSolanaAddress(keypair.publicKey.toBase58());
        } catch (error) {
          console.error("Error deriving Solana address:", error);
        }
      }
    };
    
    deriveSolanaAddress();
  }, [provider, isConnected]);

  // Social authentication functions for custom modal
  const handleSocialAuth = async (provider: string) => {
    try {
      const authConnectionMap: Record<string, string> = {
        google: AUTH_CONNECTION.GOOGLE,
        facebook: AUTH_CONNECTION.FACEBOOK,
        twitter: AUTH_CONNECTION.TWITTER,
        discord: AUTH_CONNECTION.DISCORD,
        linkedin: AUTH_CONNECTION.LINKEDIN,
        github: AUTH_CONNECTION.GITHUB,
        apple: AUTH_CONNECTION.APPLE,
      };

      await connectTo(WALLET_CONNECTORS.AUTH, {
        groupedAuthConnectionId: "aggregate-sapphire",
        authConnectionId: `w3a-${provider}`,
        authConnection: authConnectionMap[provider] || AUTH_CONNECTION.GOOGLE,
      });
    } catch (error) {
      console.error(`${provider} authentication failed:`, error);
      throw error;
    }
  };

  // Email authentication
  const handleEmailAuth = async (email: string) => {
    try {
      await connectTo(WALLET_CONNECTORS.AUTH, {
        groupedAuthConnectionId: "aggregate-sapphire",
        authConnectionId: "w3a-email-passwordless",
        authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
        extraLoginOptions: {
          login_hint: email,
        },
      });
    } catch (error) {
      console.error("Email authentication failed:", error);
      throw error;
    }
  };

  // Traditional wallet connection
  const handleWalletConnect = async (walletId: string) => {
    try {
      const walletConnectorMap: Record<string, string> = {
        metamask: WALLET_CONNECTORS.METAMASK,
        walletconnect: WALLET_CONNECTORS.WALLETCONNECT,
        coinbase: WALLET_CONNECTORS.COINBASE,
        phantom: WALLET_CONNECTORS.PHANTOM,
      };

      const connector = walletConnectorMap[walletId];
      if (connector) {
        await connectTo(connector);
      }
    } catch (error) {
      console.error(`${walletId} connection failed:`, error);
      throw error;
    }
  };

  return {
    // Connection state
    isConnected,
    isConnecting: connectLoading || disconnectLoading,
    error: connectError,
    
    // User information
    userInfo,
    
    // Ethereum state
    ethereum: {
      address: ethAddress,
      isConnected: ethConnected,
      balance: ethereumBalance,
      symbol: "ETH",
    },
    
    // Solana state
    solana: {
      address: solanaAddress || solAccounts?.[0],
      isConnected: !!solanaAddress || !!solAccounts?.[0],
      balance: solanaBalance,
      symbol: "SOL",
      connection: solConnection,
    },
    
    // Connection methods for custom modal
    handleSocialAuth,
    handleEmailAuth,
    handleWalletConnect,
    disconnect,
    
    // Utility
    formatAddress: (addr?: string) => {
      if (!addr) return "";
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    },
  };
}
```

### **Phase 3: Enhanced Custom Modal (Priority: High)**

#### **3.1: Integrate Real Web3Auth Functions**

**File**: `components/Web3Auth/Web3AuthModal.tsx` (MODIFY)

Key changes to make to the existing modal:

```typescript
// Import the real hook
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";

export const Web3AuthModal: React.FC<Web3AuthModalProps> = ({ open, onOpenChange }) => {
    // ... existing state

    // Use real Web3Auth functions
    const { 
        handleSocialAuth, 
        handleEmailAuth, 
        handleWalletConnect,
        isConnected,
        isConnecting,
        error,
        userInfo
    } = useMultiChainWallet();

    // Replace mock functions with real ones
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
            setConnectionError(error.message || "Connection failed");
        }
    }, [isConnecting, isConnected, error]);

    // Update all onClick handlers in the UI to use real functions:
    // onClick={() => handleSocialAuthClick(provider.id)}
    // onClick={handleEmailAuthClick}
    // onClick={() => handleWalletConnectClick(wallet.id)}
};
```

### **Phase 4: User Profile Integration (Priority: Medium)**

#### **4.1: Enhanced User Profile Components**

**File**: `components/Shared/UserDropdown.tsx` (MODIFY)

```typescript
import { useMultiChainWallet } from "@/hooks/use-multi-chain-wallet";

export default function UserDropdown({ className }: { className?: string }) {
    const { 
        ethereum, 
        solana, 
        userInfo, 
        disconnect, 
        formatAddress,
        isConnected 
    } = useMultiChainWallet();

    if (!isConnected) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("relative h-9 w-9 rounded-full", className)}>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={userInfo?.profileImage} alt={userInfo?.name || "User"} />
                        <AvatarFallback>
                            {userInfo?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{userInfo?.name || "Web3 User"}</p>
                        <p className="text-xs text-muted-foreground">{userInfo?.email}</p>
                    </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                {/* Multi-chain wallet info */}
                <div className="p-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Connected Wallets</div>
                    
                    {ethereum.isConnected && (
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-[8px] text-white font-bold">ETH</span>
                                </div>
                                <span className="text-xs">{formatAddress(ethereum.address)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{ethereum.balance} ETH</span>
                        </div>
                    )}
                    
                    {solana.isConnected && (
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-[8px] text-white font-bold">SOL</span>
                                </div>
                                <span className="text-xs">{formatAddress(solana.address)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{solana.balance} SOL</span>
                        </div>
                    )}
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => disconnect()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

### **Phase 5: Solana RPC Integration (Priority: Medium)**

#### **5.1: Solana Operations Helper**

**File**: `lib/solana-rpc.ts` (NEW)

```typescript
import { getED25519Key } from "@web3auth/modal";
import { Keypair, Connection, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export class SolanaRPC {
  private provider: any;
  private connection: Connection;

  constructor(provider: any) {
    this.provider = provider;
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
    );
  }

  async getAccount(): Promise<string> {
    const ethPrivateKey = await this.provider.request({ method: "private_key" });
    const privateKey = getED25519Key(ethPrivateKey).sk.toString("hex");
    const secretKey = new Uint8Array(Buffer.from(privateKey, 'hex'));
    const keypair = Keypair.fromSecretKey(secretKey);
    return keypair.publicKey.toBase58();
  }

  async getBalance(): Promise<number> {
    const account = await this.getAccount();
    const balance = await this.connection.getBalance(new PublicKey(account));
    return balance / LAMPORTS_PER_SOL;
  }

  async sendTransaction(to: string, amount: number): Promise<string> {
    const ethPrivateKey = await this.provider.request({ method: "private_key" });
    const privateKey = getED25519Key(ethPrivateKey).sk.toString("hex");
    const secretKey = new Uint8Array(Buffer.from(privateKey, 'hex'));
    const keypair = Keypair.fromSecretKey(secretKey);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(to),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const signature = await this.connection.sendTransaction(transaction, [keypair]);
    return signature;
  }
}
```

## **Dependencies & Environment**

### **Required Dependencies**

**File**: `package.json` (ADD to dependencies)

```json
{
  "dependencies": {
    "@web3auth/modal": "^10.1.0",
    "@tanstack/react-query": "^5.37.1", 
    "wagmi": "^2.14.16",
    "@solana/web3.js": "^1.98.0",
    "@solana/pay": "^0.2.6",
    "tweetnacl": "^1.0.3"
  }
}
```

### **Environment Variables**

**File**: `.env.local` (ADD)

```env
# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_from_dashboard

# Solana RPC Endpoints
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com

# Optional: WalletConnect Project ID (if using WalletConnect)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### **Web3Auth Dashboard Setup**

1. **Create Account**: Visit [dashboard.web3auth.io](https://dashboard.web3auth.io)
2. **Create Project**: Set up new project for MetaPilot
3. **Configure Authentication**:
   - Add your domain to whitelist
   - Configure social login providers (Google, Facebook, etc.)
   - Set up custom authentication connections
4. **Get Client ID**: Copy the client ID for environment variables

## **Testing Strategy**

### **Unit Testing**

```typescript
// tests/hooks/use-multi-chain-wallet.test.ts
import { renderHook } from '@testing-library/react';
import { useMultiChainWallet } from '@/hooks/use-multi-chain-wallet';

describe('useMultiChainWallet', () => {
  it('should handle social authentication', async () => {
    const { result } = renderHook(() => useMultiChainWallet());
    
    await act(async () => {
      await result.current.handleSocialAuth('google');
    });
    
    expect(result.current.isConnected).toBe(true);
  });
  
  it('should derive Solana address from Ethereum key', async () => {
    // Test cross-chain key derivation
  });
});
```

### **Integration Testing**

```typescript
// tests/components/Web3AuthModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Web3AuthModal } from '@/components/Web3Auth/Web3AuthModal';

describe('Web3AuthModal', () => {
  it('should render all authentication methods', () => {
    render(<Web3AuthModal open={true} onOpenChange={() => {}} />);
    
    expect(screen.getByText('Social')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
  });
  
  it('should handle social authentication clicks', async () => {
    // Test social authentication flow
  });
});
```

### **Manual Testing Checklist**

- [ ] Google social authentication works
- [ ] Email passwordless authentication works
- [ ] MetaMask wallet connection works
- [ ] Phantom wallet connection works
- [ ] Both ETH and SOL addresses generated
- [ ] User profile displays correctly
- [ ] Disconnect functionality works
- [ ] Modal animations work smoothly
- [ ] SSR doesn't break authentication state

## **Deployment Considerations**

### **Environment-Specific Configuration**

```typescript
// config/web3auth.ts
const getWeb3AuthNetwork = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;
    case 'staging':
      return WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;
    case 'production':
      return WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
    default:
      return WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;
  }
};
```

### **Domain Whitelisting**
- Add production domain to Web3Auth dashboard
- Configure redirect URLs for social providers
- Set up CORS policies for API endpoints

### **Performance Optimization**
- Lazy load Web3Auth components
- Implement connection state persistence
- Add loading states for better UX
- Optimize bundle size with tree shaking

## **Troubleshooting Guide**

### **Common Issues**

#### **1. Web3Auth Modal Not Loading**
```typescript
// Check client ID configuration
console.log('Web3Auth Client ID:', process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID);

// Verify provider setup
const { provider } = useWeb3Auth();
console.log('Web3Auth Provider:', provider);
```

#### **2. Social Authentication Failing**
- Verify domain is whitelisted in Web3Auth dashboard
- Check if social provider is properly configured
- Ensure redirect URLs are correct

#### **3. Solana Address Not Derived**
```typescript
// Debug key derivation
useEffect(() => {
  const debugKeyDerivation = async () => {
    if (provider) {
      try {
        const ethPrivateKey = await provider.request({ method: "private_key" });
        console.log('ETH Private Key obtained:', !!ethPrivateKey);
        
        const ed25519Key = getED25519Key(ethPrivateKey as string);
        console.log('ED25519 Key derived:', !!ed25519Key);
        
        const keypair = Keypair.fromSecretKey(ed25519Key.sk);
        console.log('Solana Address:', keypair.publicKey.toBase58());
      } catch (error) {
        console.error('Key derivation error:', error);
      }
    }
  };
  
  debugKeyDerivation();
}, [provider]);
```

#### **4. SSR Hydration Issues**
- Ensure `ssr: true` in Web3Auth config
- Use `cookieToWeb3AuthState` in layout
- Wrap client-side code with `useEffect`

### **Debug Mode**

```typescript
// Enable debug logging
const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    ssr: true,
    enableLogging: true, // Add this for debugging
  }
};
```

## **Implementation Benefits**

### **✅ Preserves Your Exact Design**
- Keeps your beautiful custom modal UI exactly as designed
- Maintains all animations, styling, and brand consistency
- No Web3Auth default modal interference

### **✅ Full Web3Auth Functionality**
- **15+ Social Logins**: Google, Facebook, Twitter, Discord, LinkedIn, GitHub, Apple
- **Email Authentication**: Passwordless email login
- **Traditional Wallets**: MetaMask, WalletConnect, Coinbase, Phantom
- **Multi-Chain Support**: Both Ethereum and Solana from single authentication
- **Solana Pay Integration**: Built-in support for QR payments

### **✅ Seamless Integration**
- Uses Web3Auth's `connectTo()` function for custom authentication
- Leverages grouped authentication connections for consistent wallet addresses
- Integrates with existing MetaPilot components and hooks
- Maintains SSR compatibility for Next.js

### **✅ Enhanced User Experience**
- **Social Login**: One-click authentication without seed phrases
- **Multi-Chain**: Single login provides both ETH and SOL wallets
- **User Profile**: Rich user information from social providers
- **Persistent Sessions**: Web3Auth handles session management

### **✅ Hackathon Ready**
- **Web3Auth Embedded Wallet SDK**: ✅ Fully integrated
- **Social/Email Login**: ✅ Seedless wallet creation
- **Solana Support**: ✅ Multi-chain functionality
- **Professional UI**: ✅ Custom branded experience

## **Next Steps**

1. **Set up Web3Auth Dashboard** - Create account and get `clientId`
2. **Install Dependencies** - Add required Web3Auth packages
3. **Replace Provider** - Switch from Wagmi-only to Web3Auth provider
4. **Update Modal** - Replace mock functions with real Web3Auth calls
5. **Test Integration** - Verify all authentication methods work
6. **Deploy & Demo** - Ready for hackathon submission

## **Success Metrics**

- [ ] All 15+ social logins functional
- [ ] Email authentication working
- [ ] Multi-chain wallets (ETH + SOL) generated
- [ ] Custom modal design preserved
- [ ] User profile integration complete
- [ ] Hackathon requirements met
- [ ] Demo-ready implementation

---

**Document Version**: 1.0  
**Last Updated**: January 16, 2025  
**Author**: MetaPilot Development Team  
**Purpose**: Web3Auth Custom Modal Implementation Guide