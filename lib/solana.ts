import {
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

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
  signTransaction?(transaction: Transaction): Promise<Transaction>;
  signAllTransactions?(transactions: Transaction[]): Promise<Transaction[]>;
  signAndSendTransaction?(transaction: Transaction, options?: any): Promise<{ signature: string } | string>;
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
    const balanceInLamports = await connection.getBalance(pubKey, 'confirmed');
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
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
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

/**
 * Sends a real SOL transfer on Solana Devnet via Phantom.
 * Truly signs via Phantom and broadcasts raw transaction to Devnet.
 * Debits user wallet and credits recipient wallet.
 */
export async function sendSolDonation(
  provider: PhantomProvider,
  recipientAddress: string,
  amountInSol: number
): Promise<string> {
  if (!provider.publicKey) {
    throw new Error('Кошелек Phantom не подключен');
  }

  const connection = new Connection(DEVNET_RPC_URL, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });

  const fromPubkey = new PublicKey(provider.publicKey.toString());
  const toPubkey = new PublicKey(recipientAddress);

  const lamports = Math.round(amountInSol * LAMPORTS_PER_SOL);
  if (lamports <= 0) {
    throw new Error('Сумма пожертвования должна быть больше 0 SOL');
  }

  // Pre-flight balance verification
  const currentLamports = await connection.getBalance(fromPubkey, 'confirmed');
  if (currentLamports < lamports + 5000) {
    const currentSol = currentLamports / LAMPORTS_PER_SOL;
    throw new Error(
      `Недостаточно SOL на балансе (${currentSol.toFixed(4)} SOL). Для перевода ${amountInSol} SOL + комиссии сети запросите тестовый Devnet Airdrop в меню кошелька.`
    );
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  let signature: string;

  // Real signing in Phantom:
  // Using signTransaction + sendRawTransaction ensures the transaction is sent directly
  // to Solana Devnet RPC, preventing conflicts if Phantom is internally set to Mainnet.
  if (typeof provider.signTransaction === 'function') {
    const signedTx = await provider.signTransaction(transaction);
    signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  } else if (typeof provider.signAndSendTransaction === 'function') {
    const res = await provider.signAndSendTransaction(transaction);
    signature = typeof res === 'string' ? res : res.signature;
  } else {
    throw new Error('Установленная версия Phantom не поддерживает подписание транзакций');
  }

  if (!signature) {
    throw new Error('Не удалось получить подпись транзакции от кошелька');
  }

  // Wait for confirmation on Solana Devnet
  try {
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );
  } catch (confirmErr) {
    console.warn('Direct confirm timed out, checking transaction status...', confirmErr);
    const status = await connection.getSignatureStatus(signature);
    if (status?.value?.err) {
      throw new Error(`Транзакция завершилась с ошибкой сети: ${JSON.stringify(status.value.err)}`);
    }
  }

  return signature;
}

/**
 * Sends a real Memo transaction to Solana Devnet using SPL Memo program.
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

  const connection = new Connection(DEVNET_RPC_URL, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });

  const userPubkey = new PublicKey(provider.publicKey.toString());

  // Strictly use TextEncoder, not Buffer
  const encoder = new TextEncoder();
  const memoData = encoder.encode(memoText);

  // Check balance for minimum network fee (~0.000005 SOL)
  const balance = await connection.getBalance(userPubkey, 'confirmed');
  if (balance < 5000) {
    throw new Error(
      'На вашем балансе 0 SOL. Для оплаты сетевой комиссии Solana Devnet (~0.000005 SOL) запросите бесплатный 1 SOL кнопкой «Запросить +1 SOL» в меню кошелька.'
    );
  }

  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: userPubkey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: memoData as unknown as Buffer,
  });

  const transaction = new Transaction().add(memoInstruction);
  transaction.feePayer = userPubkey;

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;

  let signature: string;

  if (typeof provider.signTransaction === 'function') {
    const signedTx = await provider.signTransaction(transaction);
    signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  } else if (typeof provider.signAndSendTransaction === 'function') {
    const res = await provider.signAndSendTransaction(transaction);
    signature = typeof res === 'string' ? res : res.signature;
  } else {
    throw new Error('Phantom не поддерживает подписание транзакций');
  }

  if (!signature) {
    throw new Error('Не удалось получить подпись транзакции');
  }

  try {
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );
  } catch (confirmErr) {
    console.warn('Confirm wait timeout, checking signature status:', confirmErr);
    const status = await connection.getSignatureStatus(signature);
    if (status?.value?.err) {
      throw new Error(`Ошибка транзакции: ${JSON.stringify(status.value.err)}`);
    }
  }

  return signature;
}
