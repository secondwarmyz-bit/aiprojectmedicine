'use client';

import React, { useState } from 'react';
import { X, Heart, Shield, Check, ArrowRight, ExternalLink, Loader2, AlertCircle, Coins } from 'lucide-react';
import { ResearchCampaign } from '@/lib/types';
import { SOL_USD_RATE } from '@/lib/mock-data';
import { sendSolDonation, getPhantomProvider, requestDevnetAirdrop } from '@/lib/solana';

interface DonateModalProps {
  campaign: ResearchCampaign | null;
  isOpen: boolean;
  walletAddress: string | null;
  solBalance: number | null;
  onClose: () => void;
  onDonateSuccess: (
    campaignId: string,
    amountSol: number,
    amountUsd: number,
    donorName: string,
    message: string,
    txSignature?: string
  ) => void;
  onConnectWallet: () => void;
  onRefreshBalance: () => void;
}

const PRESET_SOL_AMOUNTS = [0.1, 0.5, 1.0, 2.5, 5.0];

export const DonateModal: React.FC<DonateModalProps> = ({
  campaign,
  isOpen,
  walletAddress,
  solBalance,
  onClose,
  onDonateSuccess,
  onConnectWallet,
  onRefreshBalance,
}) => {
  const [selectedSol, setSelectedSol] = useState<number>(0.5);
  const [customSol, setCustomSol] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAirdropping, setIsAirdropping] = useState<boolean>(false);

  if (!isOpen || !campaign) return null;

  const currentSolAmount = customSol ? parseFloat(customSol) || 0 : selectedSol;
  const currentUsdAmount = Math.round(currentSolAmount * SOL_USD_RATE);

  const handleSelectPreset = (amount: number) => {
    setSelectedSol(amount);
    setCustomSol('');
    setErrorMessage(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setCustomSol(val);
    setErrorMessage(null);
  };

  const handleAirdrop = async () => {
    if (!walletAddress) return;
    setIsAirdropping(true);
    try {
      await requestDevnetAirdrop(walletAddress);
      onRefreshBalance();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAirdropping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSolAmount <= 0) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const provider = getPhantomProvider();

      if (!provider || !provider.publicKey || !walletAddress) {
        onConnectWallet();
        setErrorMessage('Пожалуйста, сначала подключите кошелек Phantom для отправки транзакции.');
        setIsSubmitting(false);
        return;
      }

      // Check balance before sending
      if (solBalance !== null && solBalance < currentSolAmount) {
        setErrorMessage(
          `Недостаточно SOL на балансе (${solBalance.toFixed(4)} SOL). Для пожертвования ${currentSolAmount} SOL запросите Devnet Airdrop (+1 SOL).`
        );
        setIsSubmitting(false);
        return;
      }

      // Execute real Solana Devnet transfer
      const sig = await sendSolDonation(
        provider,
        campaign.scientist.solanaAddress,
        currentSolAmount
      );

      setTxSignature(sig);
      onDonateSuccess(
        campaign.id,
        currentSolAmount,
        currentUsdAmount,
        donorName.trim() || `Phantom (${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)})`,
        donorMessage.trim(),
        sig
      );
      onRefreshBalance();
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Real Solana donation error:', err);
      if (err?.code === 4001 || err?.message?.includes('User rejected')) {
        setErrorMessage('Транзакция отменена: вы отклонили подписание в Phantom.');
      } else if (err?.message?.includes('0x1') || err?.message?.includes('insufficient funds')) {
        setErrorMessage('Недостаточно SOL на балансе для отправки пожертвования и оплаты комиссии сети.');
      } else {
        setErrorMessage(err.message || 'Ошибка обработки транзакции в сети Solana.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    setIsSuccess(false);
    setTxSignature(null);
    setDonorName('');
    setDonorMessage('');
    setCustomSol('');
    setSelectedSol(0.5);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0c101a] p-6 text-slate-100 shadow-2xl my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono tracking-wide">
              <span>SOLANA DEVNET DONATION</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>PHANTOM</span>
            </div>
            <h3 className="mt-1 text-base font-semibold text-white leading-snug line-clamp-1">
              {campaign.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Получатель: {campaign.scientist.name} ({campaign.scientist.solanaAddress.slice(0, 4)}...{campaign.scientist.solanaAddress.slice(-4)})
            </p>
          </div>
          <button
            onClick={handleCloseAndReset}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">
                Транзакция в сети Solana подтверждена!
              </h4>
              <p className="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Вы перевели <span className="font-mono text-cyan-400 font-semibold tabular-nums">{currentSolAmount} SOL</span> (~${currentUsdAmount}) в фонд исследования {campaign.scientist.name}.
              </p>
            </div>

            {txSignature && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 max-w-sm mx-auto text-xs text-left">
                <span className="text-[11px] text-slate-500 block mb-1">Сигнатура транзакции:</span>
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-cyan-400 hover:underline break-all inline-flex items-center gap-1"
                >
                  <span>{txSignature}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-6 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                Вернуться к исследованиям
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
            {/* Wallet status banner */}
            {!walletAddress ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Phantom кошелек не подключен</span>
                </div>
                <button
                  type="button"
                  onClick={onConnectWallet}
                  className="rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 text-xs text-amber-200 transition-colors"
                >
                  Подключить
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Ваш Phantom кошелек:</span>
                  <span className="font-mono text-xs text-slate-200">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Баланс:</span>
                  <span className="font-mono text-xs font-bold text-cyan-400 tabular-nums">
                    {solBalance !== null ? `${solBalance.toFixed(3)} SOL` : '0 SOL'}
                  </span>
                </div>
              </div>
            )}

            {/* Amount Presets in SOL */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Сумма пожертвования в SOL (Solana Devnet):
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_SOL_AMOUNTS.map((amt) => {
                  const isSelected = !customSol && selectedSol === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectPreset(amt)}
                      className={`py-2 px-1 text-center font-mono rounded-lg border transition-all tabular-nums ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-semibold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {amt} SOL
                    </button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-slate-400">Или указать SOL:</span>
                <div className="relative flex-1">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[11px]">SOL</span>
                  <input
                    type="text"
                    value={customSol}
                    onChange={handleCustomChange}
                    placeholder="Например, 1.25"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-1.5 pl-3 pr-10 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Error or Insufficient Balance Notice */}
            {errorMessage && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 text-rose-300 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                {walletAddress && (
                  <button
                    type="button"
                    onClick={handleAirdrop}
                    disabled={isAirdropping}
                    className="ml-2 inline-flex items-center gap-1 rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[11px] text-rose-100 hover:bg-rose-500/30"
                  >
                    <Coins className="h-3 w-3" />
                    <span>{isAirdropping ? 'Airdrop...' : '+1 SOL'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Donor Name & Message */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Имя донора / DAO (необязательно):
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Phantom Supporter / Личное имя"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Сообщение для научной лаборатории:
                </label>
                <textarea
                  rows={2}
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  placeholder="Слова поддержки исследователям..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Crypto calculation summary */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">К списанию в сети Solana:</span>
                <span className="font-mono text-base font-bold text-cyan-400 tabular-nums">
                  {currentSolAmount} SOL
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Примерный фиатный эквивалент:</span>
                <span className="font-mono text-xs text-slate-300 tabular-nums">
                  ≈ ${currentUsdAmount.toLocaleString('en-US')} USD
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="flex-1 rounded-lg border border-slate-800 hover:bg-slate-800 py-2.5 text-slate-300 font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={currentSolAmount <= 0 || isSubmitting}
                className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 py-2.5 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Подписание транзакции...</span>
                  </>
                ) : (
                  <>
                    <span>Подписать через Phantom</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
