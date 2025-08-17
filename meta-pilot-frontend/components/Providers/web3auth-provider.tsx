"use client";

import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IWeb3AuthState, WEB3AUTH_NETWORK, WALLET_CONNECTORS, AUTH_CONNECTION } from "@web3auth/modal";
import { ReactNode } from "react";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw";
const queryClient = new QueryClient();

// Web3Auth configuration with email and SMS passwordless
const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // Use DEVNET for development
    ssr: true, // Critical for Next.js
    uiConfig: {
      appName: "MetaPilot",
      mode: "dark",
      logoLight: "/metapilot-logo.png",
      logoDark: "/metapilot-logo.png",
      defaultLanguage: "en",
      loginMethodsOrder: ["google", "facebook", "twitter", "discord"],
      primaryButton: "socialLogin",
    },
    modalConfig: {
      connectors: {
        [WALLET_CONNECTORS.AUTH]: {
          label: "auth",
          loginMethods: {
            email_passwordless: {
              name: "email passwordless login",
              authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
              authConnectionId: "metapilot1", // Disabled for testing
            },
            sms_passwordless: {
              name: "SMS Passwordless",
              authConnection: AUTH_CONNECTION.SMS_PASSWORDLESS,
              authConnectionId: "metapilot2", // Disabled for testing
            },
          },
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