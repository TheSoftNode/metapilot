// Web3Auth configuration based on working examples
import { WALLET_CONNECTORS, WEB3AUTH_NETWORK } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";

// Client ID from environment or fallback
const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BD9DUH4UyRVXj9QTT56HNowmVdDv6QMFKGwmf22Ht803nO-kUpTKmevwO1RTlkUTtMQQkeHEAJcySQa1ZopsBl0";

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    uiConfig: {
      appName: "MetaPilot",
      appUrl: "https://metapilot.io",
      theme: {
        primary: "#3B82F6",
      },
      logoLight: "https://web3auth.io/docs/images/logo.png",
      logoDark: "https://web3auth.io/docs/images/logo.png",
      defaultLanguage: "en",
      mode: "dark",
    },
    modalConfig: {
      connectors: {
        [WALLET_CONNECTORS.AUTH]: {
          label: "auth",
          loginMethods: {
            google: {
              name: "google login",
              showOnModal: true,
            },
            facebook: {
              name: "facebook login",
              showOnModal: true,
            },
            twitter: {
              name: "twitter login",
              showOnModal: true,
            },
            discord: {
              name: "discord login",
              showOnModal: true,
            },
            linkedin: {
              name: "linkedin login",
              showOnModal: true,
            },
            github: {
              name: "github login",
              showOnModal: true,
            },
            apple: {
              name: "apple login",
              showOnModal: true,
            },
            email_passwordless: {
              name: "email passwordless login",
              showOnModal: true,
            },
          },
          showOnModal: true,
        }
      },
    },
  }
};

export default web3AuthContextConfig;