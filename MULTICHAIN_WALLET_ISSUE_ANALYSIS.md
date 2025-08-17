# MetaPilot Web3Auth Multi-Chain Wallet Issues - Root Cause Analysis & Solution

## **Executive Summary**

This document provides a comprehensive analysis of the multi-chain wallet connection issues in MetaPilot's Web3Auth integration and presents a detailed solution to fix all identified problems while preserving the existing social authentication functionality.

## **Current Problem Summary**

1. **Wallet Selection Issue**: Only selects Solana wallet, ignoring Ethereum selection
2. **MetaMask Redirect Issue**: MetaMask option redirects to Solana chain instead of Ethereum
3. **Phantom Wallet Issue**: Phantom selection triggers MetaMask instead of proper Solana wallet
4. **WalletConnect/Coinbase Issues**: These wallet connectors don't work at all
5. **Chain Selection Problem**: No proper multi-chain network switching mechanism

## **Root Cause Analysis**

### **1. Incorrect Wallet Connector Mapping**
**File**: `meta-pilot-frontend/hooks/use-multi-chain-wallet.ts:149`

```typescript
// PROBLEMATIC MAPPING
const walletConnectorMap: Record<string, string> = {
    metamask: WALLET_CONNECTORS.METAMASK,
    walletconnect: WALLET_CONNECTORS.WALLET_CONNECT_V2,  // Wrong constant
    coinbase: WALLET_CONNECTORS.COINBASE,
    phantom: WALLET_CONNECTORS.METAMASK, // Wrong! Phantom using MetaMask connector
};
```

**Issues:**
- Phantom mapped to `WALLET_CONNECTORS.METAMASK` instead of dedicated Solana connector
- WalletConnect using wrong constant (`WALLET_CONNECT_V2` vs `WALLETCONNECT`)
- Missing proper chain-specific connector differentiation

### **2. Missing Chain-Specific Provider Configuration**
**File**: `meta-pilot-frontend/components/Providers/web3auth-provider.tsx`

**Issues:**
- Not using `@web3auth/ethereum-provider` and `@web3auth/solana-provider` packages properly
- Missing chain-specific provider configurations
- Incomplete modal configuration for multi-chain support

### **3. Inadequate Web3Auth Modal Configuration**
**Issues:**
- Missing chain adapters for Ethereum and Solana
- Incomplete connector configuration for multi-chain support
- No proper wallet connector differentiation between chains

### **4. Incorrect Provider Usage Pattern**
**File**: `meta-pilot-frontend/hooks/use-multi-chain-wallet.ts`

**Issues:**
- Single provider instance trying to handle both Ethereum and Solana
- Missing chain-specific RPC configurations
- No network switching mechanism

## **Solution Architecture**

### **Phase 1: Fix Wallet Connector Constants and Mapping**

**Problem**: Wrong connector constants and mappings
**Solution**: Use correct Web3Auth connector constants and create chain-specific mappings

```typescript
// CORRECTED MAPPING
const ethereumWalletMap: Record<string, string> = {
    metamask: WALLET_CONNECTORS.METAMASK,
    walletconnect: WALLET_CONNECTORS.WALLETCONNECT, // Correct constant
    coinbase: WALLET_CONNECTORS.COINBASE,
};

const solanaWalletMap: Record<string, string> = {
    phantom: WALLET_CONNECTORS.PHANTOM, // Dedicated Phantom connector
    solflare: WALLET_CONNECTORS.SOLFLARE,
    // Add other Solana wallets
};
```

### **Phase 2: Implement Chain-Specific Providers**

**Problem**: Single provider trying to handle multiple chains
**Solution**: Use dedicated chain adapters and providers

```typescript
// Add chain adapters to Web3Auth configuration
import { EthereumAdapter } from "@web3auth/ethereum-provider";
import { SolanaAdapter } from "@web3auth/solana-provider";

// Configure separate chain adapters
const chainConfig = {
  ethereum: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x1", // Ethereum Mainnet
    rpcTarget: "https://mainnet.infura.io/v3/...",
    displayName: "Ethereum Mainnet",
    blockExplorer: "https://etherscan.io/",
    ticker: "ETH",
    tickerName: "Ethereum",
  },
  solana: {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    chainId: "0x1", // Solana Mainnet
    rpcTarget: "https://api.mainnet-beta.solana.com",
    displayName: "Solana Mainnet",
    blockExplorer: "https://explorer.solana.com/",
    ticker: "SOL",
    tickerName: "Solana",
  },
};
```

### **Phase 3: Enhanced Modal Configuration**

**Problem**: Incomplete modal configuration for multi-chain support
**Solution**: Configure proper modal with chain-specific connectors

```typescript
modalConfig: {
  connectors: {
    [WALLET_CONNECTORS.METAMASK]: {
      name: "MetaMask",
      showOnModal: true,
      chainNamespace: CHAIN_NAMESPACES.EIP155,
    },
    [WALLET_CONNECTORS.PHANTOM]: {
      name: "Phantom",
      showOnModal: true,
      chainNamespace: CHAIN_NAMESPACES.SOLANA,
    },
    [WALLET_CONNECTORS.WALLETCONNECT]: {
      name: "WalletConnect",
      showOnModal: true,
      chainNamespace: CHAIN_NAMESPACES.EIP155,
    },
    [WALLET_CONNECTORS.COINBASE]: {
      name: "Coinbase Wallet",
      showOnModal: true,
      chainNamespace: CHAIN_NAMESPACES.EIP155,
    },
  },
}
```

### **Phase 4: Implement Chain Switching Logic**

**Problem**: No mechanism to switch between chains
**Solution**: Add chain switching functionality

```typescript
const switchToChain = async (chainType: 'ethereum' | 'solana') => {
  if (chainType === 'ethereum') {
    // Switch to Ethereum chain
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x1" }],
    });
  } else {
    // Switch to Solana chain
    // Implement Solana chain switching
  }
  setCurrentNetwork(chainType);
};
```

### **Phase 5: Fix handleWalletConnect Function**

**Problem**: Single wallet connect function not handling chain-specific connections
**Solution**: Implement chain-aware wallet connection

```typescript
const handleWalletConnect = async (walletId: string, chainType?: 'ethereum' | 'solana') => {
  try {
    let connector: string;
    
    if (chainType === 'solana' || ['phantom', 'solflare'].includes(walletId)) {
      connector = solanaWalletMap[walletId];
    } else {
      connector = ethereumWalletMap[walletId];
    }
    
    if (connector) {
      await connectTo(connector as any);
      
      // Set the current network based on wallet type
      if (['phantom', 'solflare'].includes(walletId)) {
        setCurrentNetwork('solana');
      } else {
        setCurrentNetwork('ethereum');
      }
    }
  } catch (error) {
    console.error(`${walletId} connection failed:`, error);
    throw error;
  }
};
```

## **Implementation Steps Overview**

### **Step 1**: Update Web3Auth Provider Configuration
- Add proper chain adapters (Ethereum + Solana)
- Configure modal with chain-specific connectors
- Set up proper RPC configurations

### **Step 2**: Fix Wallet Connector Mappings
- Correct wallet connector constants
- Separate Ethereum and Solana wallet mappings
- Remove incorrect Phantom → MetaMask mapping

### **Step 3**: Enhance Multi-Chain Hook
- Add chain switching logic
- Implement proper provider management for each chain
- Add chain-specific balance and transaction methods

### **Step 4**: Update Modal UI
- Add chain selection UI component
- Update wallet buttons to specify chain type
- Add visual indicators for chain-specific wallets

### **Step 5**: Add Chain-Specific RPC Methods
- Implement proper Ethereum RPC calls using `@web3auth/ethereum-provider`
- Implement proper Solana RPC calls using `@web3auth/solana-provider`
- Add cross-chain address derivation (already working)

## **Expected Outcome**

After implementing these fixes:

1. ✅ **MetaMask** → Connects to Ethereum network properly
2. ✅ **Phantom** → Connects to Solana network (not MetaMask)
3. ✅ **WalletConnect** → Works with 250+ supported wallets on Ethereum
4. ✅ **Coinbase** → Connects to Ethereum network properly
5. ✅ **Multi-Chain Support** → User can switch between Ethereum and Solana
6. ✅ **Social Logins** → Continue working perfectly (unchanged)
7. ✅ **Cross-Chain Addresses** → Single auth provides both ETH and SOL addresses

## **Files That Need Modification**

1. `meta-pilot-frontend/components/Providers/web3auth-provider.tsx` - Add chain adapters
2. `meta-pilot-frontend/hooks/use-multi-chain-wallet.ts` - Fix connector mappings and add chain switching
3. `meta-pilot-frontend/components/Web3Auth/Web3AuthModal.tsx` - Add chain selection UI
4. `meta-pilot-frontend/lib/solana-rpc.ts` - Enhance with proper Solana provider usage

## **Critical Requirements**

1. **DO NOT MODIFY SOCIAL AUTHENTICATION**: Social logins (Google, Facebook, Twitter, etc.) are working perfectly and must remain untouched
2. **PRESERVE EXISTING UI**: The custom modal design should be maintained
3. **MAINTAIN CROSS-CHAIN DERIVATION**: The existing Solana address derivation from Ethereum private key should continue working
4. **ENSURE BACKWARDS COMPATIBILITY**: Existing user sessions should not be broken

## **Web3Auth Package Dependencies**

Current packages in use:
- `@web3auth/modal: ^10.2.0`
- `@web3auth/ethereum-provider: ^9.7.0`
- `@web3auth/solana-provider: ^9.7.0`

These are the correct versions and should support the required functionality.

## **Testing Checklist**

After implementation, verify:
- [ ] Google social authentication still works
- [ ] MetaMask connects to Ethereum (not Solana)
- [ ] Phantom connects to Solana (not MetaMask)
- [ ] WalletConnect shows QR code and connects properly
- [ ] Coinbase Wallet connects to Ethereum
- [ ] Both ETH and SOL addresses are derived correctly
- [ ] User can switch between networks
- [ ] Existing user sessions remain functional

## **Next Steps**

1. Review and approve this analysis
2. Begin implementation following the outlined phases
3. Test each component thoroughly
4. Ensure social authentication remains unaffected
5. Deploy and verify in production environment

---

**Document Version**: 1.0  
**Last Updated**: January 17, 2025  
**Author**: MetaPilot Development Team  
**Purpose**: Multi-Chain Wallet Issue Resolution Guide