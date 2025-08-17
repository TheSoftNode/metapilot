import { getED25519Key } from "@web3auth/modal";
import { Keypair, Connection, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import nacl from 'tweetnacl';

export class SolanaRPC {
  private provider: any;
  private connection: Connection;

  constructor(provider: any) {
    this.provider = provider;
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
    );
  }

  private async getKeypair(): Promise<Keypair> {
    const ethPrivateKey = await this.provider.request({ method: "private_key" });
    const privateKey = getED25519Key(ethPrivateKey as string).sk.toString("hex");
    const secretKey = new Uint8Array(Buffer.from(privateKey, 'hex'));
    return Keypair.fromSecretKey(secretKey);
  }

  async getAccount(): Promise<string> {
    const keypair = await this.getKeypair();
    return keypair.publicKey.toBase58();
  }

  async getBalance(): Promise<number> {
    const keypair = await this.getKeypair();
    const balance = await this.connection.getBalance(keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async signMessage(message: string): Promise<string> {
    try {
      const keypair = await this.getKeypair();
      
      // Convert message to Uint8Array
      const messageBytes = new TextEncoder().encode(message);
      
      // Sign the message
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      
      return Buffer.from(signature).toString('base64');
    } catch (error) {
      console.error("Error signing Solana message:", error);
      throw error;
    }
  }

  async sendTransaction(to: string, amount: number): Promise<string> {
    try {
      const keypair = await this.getKeypair();

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: new PublicKey(to),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = keypair.publicKey;

      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [keypair]
      );

      return signature;
    } catch (error) {
      console.error("Error sending Solana transaction:", error);
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const keypair = await this.getKeypair();
      transaction.sign(keypair);
      return transaction;
    } catch (error) {
      console.error("Error signing Solana transaction:", error);
      throw error;
    }
  }

  async getTokenBalances(tokenMints: string[]): Promise<Record<string, number>> {
    try {
      const keypair = await this.getKeypair();
      const balances: Record<string, number> = {};

      for (const mint of tokenMints) {
        try {
          // Get associated token account
          const { getAssociatedTokenAddress } = await import("@solana/spl-token");
          const tokenAccount = await getAssociatedTokenAddress(
            new PublicKey(mint),
            keypair.publicKey
          );

          // Get token balance
          const balance = await this.connection.getTokenAccountBalance(tokenAccount);
          balances[mint] = balance.value.uiAmount || 0;
        } catch (error) {
          // Token account might not exist
          balances[mint] = 0;
        }
      }

      return balances;
    } catch (error) {
      console.error("Error getting token balances:", error);
      throw error;
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<any[]> {
    try {
      const keypair = await this.getKeypair();
      const signatures = await this.connection.getSignaturesForAddress(
        keypair.publicKey,
        { limit }
      );

      const transactions = [];
      for (const sigInfo of signatures) {
        try {
          const tx = await this.connection.getTransaction(sigInfo.signature, {
            commitment: "confirmed",
          });
          if (tx) {
            transactions.push({
              signature: sigInfo.signature,
              slot: sigInfo.slot,
              blockTime: sigInfo.blockTime,
              transaction: tx,
            });
          }
        } catch (error) {
          console.error("Error fetching transaction:", error);
        }
      }

      return transactions;
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      throw error;
    }
  }
}

// Utility functions for Solana operations
export const solanaUtils = {
  /**
   * Validate Solana address
   */
  isValidAddress: (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Convert lamports to SOL
   */
  lamportsToSol: (lamports: number): number => {
    return lamports / LAMPORTS_PER_SOL;
  },

  /**
   * Convert SOL to lamports
   */
  solToLamports: (sol: number): number => {
    return sol * LAMPORTS_PER_SOL;
  },

  /**
   * Format Solana address for display
   */
  formatAddress: (address: string, chars: number = 4): string => {
    if (!address) return "";
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  },

  /**
   * Get Solana explorer URL
   */
  getExplorerUrl: (signature: string, network: "mainnet" | "devnet" = "devnet"): string => {
    const cluster = network === "mainnet" ? "" : `?cluster=${network}`;
    return `https://explorer.solana.com/tx/${signature}${cluster}`;
  },
};