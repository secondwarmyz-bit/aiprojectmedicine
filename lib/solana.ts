import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';

export const DEVNET_RPC_URL = clusterApiUrl('devnet');
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: {
    toString(): string;
    toBase58(): string;
  };
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;

  const win = window as any;
  if (win.phantom?.solana?.isPhantom) {
    return win.phantom.solana;
  }
  if (win.solana?.isPhantom) {
    return win.solana;
  }
  return null;
}

export function formatSolanaAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export async function fetchSolBalance(address: string): Promise<number> {
  try {
    const connection = new Connection(DEVNET_RPC_URL, 'confirmed');
    const pubKey = new PublicKey(address);
    const balanceInLamports = await connection.getBalance(pubKey);
    return balanceInLamports / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    return 0;
  }
}

export async function requestDevnetAirdrop(address: string): Promise<string> {
  const connection = new Connection(DEVNET_RPC_URL, 'confirmed');
  const pubKey = new PublicKey(address);
  const signature = await connection.requestAirdrop(pubKey, 1 * LAMPORTS_PER_SOL);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
  return signature;
}

export async function sendSolDonation(
  provider: PhantomProvider,
  recipientAddress: string,
  amountInSol: number
): Promise<string> {
  if (!provider.publicKey) {
    throw new Error('Кошелек не подключен');
  }

  const connection = new Connection(DEVNET_RPC_URL, 'confirmed');
  const fromPubkey = new PublicKey(provider.publicKey.toString());
  const toPubkey = new PublicKey(recipientAddress);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: Math.round(amountInSol * LAMPORTS_PER_SOL),
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  const { signature } = await provider.signAndSendTransaction(transaction);
  
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, 'confirmed');

  return signature;
}

/**
 * Sends a Memo transaction to Solana Devnet using SPL Memo program.
 * Encodes text using TextEncoder (not Buffer).
 * Fee is paid by the user's wallet.
 */
export async function sendMemoTransaction(
  provider: PhantomProvider,
  memoText: string
): Promise<string> {
  if (!provider.publicKey) {
    throw new Error('Кошелек Phantom не подключен');
  }

  const connection = new Connection(DEVNET_RPC_URL, 'confirmed');
  const userPubkey = new PublicKey(provider.publicKey.toString());

  // Strictly use TextEncoder, not Buffer
  const encoder = new TextEncoder();
  const memoData = encoder.encode(memoText);

  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: userPubkey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: memoData as unknown as Buffer,
  });

  const transaction = new Transaction().add(memoInstruction);
  transaction.feePayer = userPubkey;

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;

  const { signature } = await provider.signAndSendTransaction(transaction);

  await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    'confirmed'
  );

  return signature;
}
