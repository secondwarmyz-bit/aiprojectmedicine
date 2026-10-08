'use client';

import React from 'react';
import { Wallet, AlertCircle, ExternalLink, RefreshCw, PlusCircle, Check } from 'lucide-react';
import { formatSolanaAddress } from '@/lib/solana';

interface TopBarProps {
  walletAddress: string | null;
  solBalance: number | null;
  isConnecting: boolean;
  phantomNotFound: boolean;
  onConnect: () => void;
  onOpenDetails: () => void;
  onNewCampaign: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  walletAddress,
  solBalance,
  isConnecting,
  phantomNotFound,
  onConnect,
  onOpenDetails,
  onNewCampaign,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Zone: Clean wordmark with single line */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400">
            <span className="font-mono text-sm font-bold">℞</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-white">
              AI Medical Research Bounty
            </span>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onNewCampaign}
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 transition-colors whitespace-nowrap"
          >
            <PlusCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span>Начать сбор ученым</span>
          </button>

          {/* Wallet Button */}
          {walletAddress ? (
            <div className="flex items-center gap-2">
              {/* Balance in SOL on devnet */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-cyan-400 tabular-nums">
                  {solBalance !== null ? `${solBalance.toFixed(3)} SOL` : 'Загрузка...'}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">devnet</span>
              </div>

              {/* Connected Address Button */}
              <button
                type="button"
                onClick={onOpenDetails}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3.5 py-1.5 text-xs font-mono font-medium text-cyan-300 transition-all hover:bg-cyan-900/40 hover:border-cyan-400"
                title="Нажмите для управления кошельком Phantom"
              >
                <Wallet className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>{formatSolanaAddress(walletAddress)}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:border-cyan-500/60 hover:bg-slate-800 hover:text-cyan-200 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  <span>Подключение...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Подключить кошелёк</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notice if Phantom not found */}
      {phantomNotFound && (
        <div className="border-t border-amber-500/30 bg-amber-950/40 px-4 py-2 text-xs text-amber-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Откройте приложение в отдельной вкладке с установленным Phantom</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="inline-flex items-center gap-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2 py-0.5 text-[11px] font-medium text-amber-100 transition-colors"
              >
                <span>Открыть в новой вкладке</span>
                <ExternalLink className="h-3 w-3" />
              </button>
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-300 hover:underline"
              >
                Скачать Phantom
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
