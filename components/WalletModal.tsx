'use client';

import React, { useState } from 'react';
import { X, Wallet, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Coins, LogOut } from 'lucide-react';
import { requestDevnetAirdrop, formatSolanaAddress } from '@/lib/solana';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string | null;
  solBalance: number | null;
  phantomNotFound: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefreshBalance: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  solBalance,
  phantomNotFound,
  onConnect,
  onDisconnect,
  onRefreshBalance,
}) => {
  const [copied, setCopied] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRequestAirdrop = async () => {
    if (!walletAddress) return;
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      await requestDevnetAirdrop(walletAddress);
      setAirdropMsg('Успешно начислен 1 SOL на Devnet!');
      setTimeout(() => {
        onRefreshBalance();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setAirdropMsg('Лимит airdrop исчерпан или сеть перегружена. Попробуйте чуть позже.');
    } finally {
      setIsAirdropping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0c101a] p-6 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Phantom Кошелёк (Solana)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Сеть: Solana Devnet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          {walletAddress ? (
            <>
              {/* Address Display */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Подключенный адрес:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-200 break-all select-all">
                    {walletAddress}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Скопировать адрес"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Devnet SOL Balance */}
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Баланс в сети Solana Devnet:</span>
                    <div className="font-mono text-2xl font-bold text-cyan-300 tabular-nums">
                      {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : 'Загрузка...'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onRefreshBalance}
                    className="p-2 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Обновить баланс"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Airdrop helper */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Нужны тестовые SOL?
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Запросите бесплатный 1 SOL на devnet
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestAirdrop}
                    disabled={isAirdropping}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors disabled:opacity-50"
                  >
                    {isAirdropping ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Coins className="h-3 w-3" />
                    )}
                    <span>{isAirdropping ? 'Запрос...' : '+1 SOL Devnet'}</span>
                  </button>
                </div>
                {airdropMsg && (
                  <p className="mt-2 text-[11px] text-cyan-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> {airdropMsg}
                  </p>
                )}
              </div>

              {/* Explorer link & Disconnect */}
              <div className="flex items-center justify-between pt-2">
                <a
                  href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <span>Смотреть в Solana Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    onDisconnect();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Отключить</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not connected state */}
              {phantomNotFound ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-amber-200">
                        Откройте приложение в отдельной вкладке с установленным Phantom
                      </h4>
                      <p className="mt-1 text-xs text-amber-300/80 leading-relaxed">
                        Браузерные расширения (включая Phantom) изолируются внутри предпросмотра iframe. Для прямого подключения кошелька откройте приложение в обычной вкладке браузера.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="flex-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 py-2 px-3 text-xs font-medium text-amber-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Открыть в отдельной вкладке</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <a
                      href="https://phantom.app/"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-800 hover:bg-slate-800 py-2 px-3 text-xs text-center text-slate-300 transition-colors"
                    >
                      Установить Phantom
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-400">
                    Подключите расширение Phantom для подписания реальных транзакций в сети Solana Devnet.
                  </p>
                  <button
                    type="button"
                    onClick={onConnect}
                    className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-semibold text-white transition-colors"
                  >
                    Подключить через window.phantom.solana
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
