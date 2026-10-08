'use client';

import React from 'react';
import Image from 'next/image';
import { Heart, ArrowUpRight, Users, Clock, ExternalLink } from 'lucide-react';
import { ResearchCampaign } from '@/lib/types';
import { formatSolanaAddress } from '@/lib/solana';

interface CampaignCardProps {
  campaign: ResearchCampaign;
  onDonate: (campaign: ResearchCampaign) => void;
  onViewDetails: (campaign: ResearchCampaign) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onDonate,
  onViewDetails,
}) => {
  const percentRaised = Math.min(
    100,
    Math.round((campaign.raisedSol / campaign.targetSol) * 100)
  );

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0e1320] p-5 transition-all duration-200 hover:border-cyan-500/40 hover:bg-[#111726]">
      <div>
        {/* Unboxed Metadata Kicker (Zero-Pill Discipline) */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mb-2">
          <span className="text-cyan-400 font-medium">{campaign.medicalProblem}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{campaign.stage.split(' ')[0]} {campaign.stage.split(' ')[1] || ''}</span>
          {campaign.isUserCreated && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400">Новый сбор</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(campaign)}
          className="text-base font-semibold text-white leading-snug cursor-pointer hover:text-cyan-300 transition-colors line-clamp-2"
        >
          {campaign.title}
        </h3>

        {/* Scientist block */}
        <div className="mt-3.5 flex items-center gap-3">
          {campaign.scientist.avatarUrl ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-700">
              <Image
                src={campaign.scientist.avatarUrl}
                alt={campaign.scientist.name}
                fill
                sizes="40px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 font-mono text-xs font-semibold text-cyan-400">
              {campaign.scientist.name.slice(0, 2)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-slate-200 truncate">
              {campaign.scientist.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono truncate">
              <span>{campaign.scientist.institution}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-cyan-500/80">{formatSolanaAddress(campaign.scientist.solanaAddress)}</span>
            </div>
          </div>
        </div>

        {/* Problem summary */}
        <p className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {campaign.unresolvedBarrier}
        </p>
      </div>

      {/* Progress & Actions Section in Phantom SOL */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-baseline justify-between mb-1.5 text-xs">
          <div className="font-mono tabular-nums">
            <span className="text-sm font-bold text-cyan-400">
              {campaign.raisedSol.toFixed(1)} SOL
            </span>{' '}
            <span className="text-[11px] text-slate-400">
              / {campaign.targetSol.toFixed(1)} SOL
            </span>
            <span className="text-[10px] text-slate-500 ml-1.5 hidden sm:inline">
              (≈${campaign.raisedAmount.toLocaleString('en-US')})
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-cyan-400 tabular-nums">
            {percentRaised}%
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-500 rounded-full"
            style={{ width: `${percentRaised}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-slate-500" />
            <span className="text-slate-300 tabular-nums">{campaign.donorCount}</span> доноров
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-500" />
            осталось <span className="text-slate-300 tabular-nums">{campaign.daysRemaining}</span> дн.
          </span>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(campaign)}
            className="flex-1 rounded-lg border border-slate-700/80 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-800 py-2 text-xs font-medium text-slate-200 transition-colors text-center"
          >
            Подробнее
          </button>
          <button
            type="button"
            onClick={() => onDonate(campaign)}
            className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-950"
          >
            <Heart className="h-3 w-3" />
            <span>Внести SOL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
