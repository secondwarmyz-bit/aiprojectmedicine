'use client';

import React, { useState } from 'react';
import { X, Heart, ShieldAlert, CheckCircle2, DollarSign, Copy, Check, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { ResearchCampaign } from '@/lib/types';
import { formatSolanaAddress } from '@/lib/solana';

interface CampaignDetailsModalProps {
  campaign: ResearchCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDonate: (campaign: ResearchCampaign) => void;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onOpenDonate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !campaign) return null;

  const percentRaised = Math.min(
    100,
    Math.round((campaign.raisedSol / campaign.targetSol) * 100)
  );

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(campaign.scientist.solanaAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0c101a] p-6 text-slate-100 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
              <span>СТАДИЯ: {campaign.stage}</span>
            </div>
            <h2 className="mt-1.5 text-lg font-semibold text-white leading-tight">
              {campaign.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ml-4 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scientist Bio & Solana Address */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            {campaign.scientist.avatarUrl ? (
              <div className="relative h-12 w-12 rounded-full overflow-hidden border border-slate-700 shrink-0">
                <Image
                  src={campaign.scientist.avatarUrl}
                  alt={campaign.scientist.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-semibold text-cyan-400 text-sm shrink-0">
                {campaign.scientist.name.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white">{campaign.scientist.name}</h4>
              <p className="text-xs text-slate-400 truncate">{campaign.scientist.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span>{campaign.scientist.institution}</span>
              </div>
            </div>
          </div>

          {/* Research Solana devnet wallet */}
          <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-mono">Solana Devnet Wallet:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-xs text-cyan-400 font-medium">
                {formatSolanaAddress(campaign.scientist.solanaAddress)}
              </span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="p-1 text-slate-400 hover:text-white rounded"
                title="Скопировать Solana адрес"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
              <a
                href={`https://explorer.solana.com/address/${campaign.scientist.solanaAddress}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-cyan-300"
                title="Смотреть в Solana Explorer"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Financial Progress in SOL */}
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-xs text-slate-400">Собрано в сети Solana</span>
              <div className="font-mono text-xl font-bold text-cyan-400 tabular-nums">
                {campaign.raisedSol.toFixed(1)} SOL{' '}
                <span className="text-xs font-normal text-slate-400">/ {campaign.targetSol.toFixed(1)} SOL</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                ≈ ${campaign.raisedAmount.toLocaleString('en-US')} из ${campaign.targetAmount.toLocaleString('en-US')} USD
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Выполнение цели</span>
              <div className="font-mono text-xl font-bold text-white tabular-nums">
                {percentRaised}%
              </div>
            </div>
          </div>

          {/* Bar */}
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${percentRaised}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
            <span>Спонсоров: <strong className="text-slate-200 font-mono">{campaign.donorCount}</strong></span>
            <span>Осталось: <strong className="text-slate-200 font-mono">{campaign.daysRemaining} дн.</strong></span>
          </div>
        </div>

        {/* Research Core Content */}
        <div className="mt-5 space-y-4 text-xs leading-relaxed">
          <div>
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1 text-sm">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Нерешенная медицинская проблема и барьер</span>
            </h4>
            <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 text-slate-300">
              <p className="font-medium text-white mb-1">{campaign.medicalProblem}</p>
              <p className="text-slate-400">{campaign.unresolvedBarrier}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Предлагаемое решение и научная гипотеза</span>
            </h4>
            <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 text-slate-300">
              <p className="text-slate-300">{campaign.proposedSolution}</p>
            </div>
          </div>

          {/* Budget Breakdown in SOL */}
          <div>
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1.5 text-sm">
              <DollarSign className="h-4 w-4 text-cyan-400" />
              <span>Прозрачная смета расходов лаборатории</span>
            </h4>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 divide-y divide-slate-800/60">
              {campaign.budgetBreakdown.map((item, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{item.item}</span>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="text-slate-500">{item.percentage}%</span>
                    <span className="text-cyan-300 font-medium">{item.amountSol} SOL</span>
                    <span className="text-slate-500 text-[11px]">(${item.amount.toLocaleString('en-US')})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Donations */}
          {campaign.recentDonations && campaign.recentDonations.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-200 mb-1.5 text-sm">
                Последние транзакции (Solana Devnet)
              </h4>
              <div className="space-y-1.5">
                {campaign.recentDonations.map((tx) => (
                  <div key={tx.id} className="rounded border border-slate-800/60 bg-slate-900/30 p-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-200">{tx.donorName}</span>
                      {tx.message && <p className="text-[11px] text-slate-400 italic">«{tx.message}»</p>}
                      {tx.signature && (
                        <div className="text-[10px] text-cyan-500/80 font-mono">
                          tx: {tx.signature}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="font-mono text-cyan-400 font-bold tabular-nums">+{tx.amountSol} SOL</span>
                      <div className="text-[10px] text-slate-500">{tx.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 hover:bg-slate-800 py-2.5 px-4 text-xs font-medium text-slate-300 transition-colors"
          >
            Закрыть
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDonate(campaign);
            }}
            className="rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2.5 px-6 text-xs font-semibold text-white transition-colors flex items-center gap-2"
          >
            <Heart className="h-3.5 w-3.5" />
            <span>Внести SOL через Phantom</span>
          </button>
        </div>
      </div>
    </div>
  );
};
