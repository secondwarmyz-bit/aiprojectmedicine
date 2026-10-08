'use client';

import React from 'react';
import { FileText, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { BlockchainRecord } from '@/lib/types';

interface BlockchainRecordsListProps {
  records: BlockchainRecord[];
}

export const BlockchainRecordsList: React.FC<BlockchainRecordsListProps> = ({ records }) => {
  if (records.length === 0) return null;

  return (
    <div className="mt-12 rounded-xl border border-slate-800 bg-[#0c101a] p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Реестр записей в блокчейне (Solana Devnet Memo)
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Программа: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Неизменяемые фиксации намерений ({records.length})</span>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-800/60">
        {records.map((rec) => (
          <div
            key={rec.id}
            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-mono text-slate-200 text-xs break-words font-medium leading-relaxed">
                «{rec.text}»
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{rec.timestamp}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>сигнатура: {rec.txSignature.slice(0, 8)}...{rec.txSignature.slice(-8)}</span>
              </div>
            </div>

            <div className="shrink-0 pt-1 sm:pt-0">
              <a
                href={rec.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 px-3 py-1.5 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                <span>Посмотреть запись</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
