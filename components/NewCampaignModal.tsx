'use client';

import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, Loader2, Wallet } from 'lucide-react';
import { ResearchCampaign } from '@/lib/types';
import { SOL_USD_RATE } from '@/lib/mock-data';

interface NewCampaignModalProps {
  isOpen: boolean;
  walletAddress: string | null;
  onClose: () => void;
  onAddCampaign: (campaign: ResearchCampaign) => void;
}

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
  isOpen,
  walletAddress,
  onClose,
  onAddCampaign,
}) => {
  const [scientistName, setScientistName] = useState('');
  const [institution, setInstitution] = useState('');
  const [academicTitle, setAcademicTitle] = useState('Кандидат биологических наук, исследователь');
  const [medicalProblem, setMedicalProblem] = useState('');
  const [unresolvedBarrier, setUnresolvedBarrier] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [category, setCategory] = useState<ResearchCampaign['category']>('oncology');
  const [targetSol, setTargetSol] = useState('350');
  const [solanaAddress, setSolanaAddress] = useState(walletAddress || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAiAssist = async () => {
    if (!medicalProblem.trim()) {
      setAiNotice('Укажите сначала изучаемую проблему или болезнь (например: "Болезнь Альцгеймера")');
      return;
    }
    setIsAiLoading(true);
    setAiNotice(null);
    try {
      const res = await fetch('/api/research/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: medicalProblem,
          hypothesis: proposedSolution,
          targetField: category,
        }),
      });
      const data = await res.json();
      if (data.title) {
        if (data.unresolvedBarrier) setUnresolvedBarrier(data.unresolvedBarrier);
        if (data.proposedSolution) setProposedSolution(data.proposedSolution);
        if (data.recommendedBudget) {
          const inSol = Math.round((data.recommendedBudget / SOL_USD_RATE) * 10) / 10;
          setTargetSol(String(inSol));
        }
        setAiNotice('AI сформулировал барьер и план исследования в расчете Solana!');
      }
    } catch (err) {
      console.error(err);
      setAiNotice('Не удалось связаться с AI сервисом, используйте ручной ввод.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scientistName.trim() || !medicalProblem.trim() || !unresolvedBarrier.trim()) {
      return;
    }

    const solGoal = parseFloat(targetSol) || 300;
    const usdGoal = Math.round(solGoal * SOL_USD_RATE);
    const scientistWallet = solanaAddress.trim() || walletAddress || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

    const newCampaign: ResearchCampaign = {
      id: `bounty-user-${Date.now()}`,
      title: `Исследование преодоления барьера: ${medicalProblem}`,
      medicalProblem: medicalProblem.trim(),
      unresolvedBarrier: unresolvedBarrier.trim(),
      proposedSolution: proposedSolution.trim() || 'Проведение серии молекулярно-генетических экспериментов и валидация биомаркеров.',
      category,
      scientist: {
        id: `sci-${Date.now()}`,
        name: scientistName.trim(),
        title: academicTitle.trim(),
        institution: institution.trim() || 'Независимая исследовательская лаборатория',
        orcid: '0000-0002-XXXX-XXXX',
        avatarUrl: '',
        solanaAddress: scientistWallet,
      },
      targetAmount: usdGoal,
      raisedAmount: 0,
      targetSol: solGoal,
      raisedSol: 0,
      donorCount: 0,
      daysRemaining: 45,
      stage: 'Инициация сбора в сети Solana (Devnet)',
      budgetBreakdown: [
        { item: 'Биореактивы и клеточный материал', percentage: 45, amount: Math.round(usdGoal * 0.45), amountSol: Math.round(solGoal * 0.45 * 10) / 10 },
        { item: 'Аналитическое оборудование и микроскопия', percentage: 35, amount: Math.round(usdGoal * 0.35), amountSol: Math.round(solGoal * 0.35 * 10) / 10 },
        { item: 'Публикация в открытом доступе и биоинформатика', percentage: 20, amount: Math.round(usdGoal * 0.20), amountSol: Math.round(solGoal * 0.20 * 10) / 10 },
      ],
      recentDonations: [],
      isUserCreated: true,
    };

    onAddCampaign(newCampaign);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-[#0c101a] p-6 text-slate-100 shadow-2xl my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs text-cyan-400 font-mono tracking-wide">
              РЕГИСТРАЦИЯ ИССЛЕДОВАТЕЛЬСКОГО СБОРА (SOLANA)
            </span>
            <h3 className="mt-1 text-base font-semibold text-white">
              Запуск кампании для ученых
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Создайте открытый научный грант для получения прямых крипто-пожертвований через Phantom
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Scientist info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ФИО ведущего исследователя *
              </label>
              <input
                type="text"
                required
                value={scientistName}
                onChange={(e) => setScientistName(e.target.value)}
                placeholder="Д-р Михаил Орлов"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Научный институт / лаборатория *
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Институт молекулярной медицины"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Solana Address & Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Цель сбора в SOL (Solana Devnet) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  required
                  value={targetSol}
                  onChange={(e) => setTargetSol(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 pl-3 pr-12 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-cyan-400">
                  SOL
                </span>
              </div>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Solana кошелек лаборатории
              </label>
              <input
                type="text"
                value={solanaAddress}
                onChange={(e) => setSolanaAddress(e.target.value)}
                placeholder={walletAddress || 'Адрес Solana кошелька'}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Научная область *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ResearchCampaign['category'])}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="oncology">Онкология</option>
              <option value="neurology">Неврология & Нейродегенерация</option>
              <option value="genetics">Генетические патологии</option>
              <option value="infectious">Суперинфекции & Резистентность</option>
              <option value="rare_diseases">Редкие (орфанные) болезни</option>
            </select>
          </div>

          {/* Problem & AI formulation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">
                Нерешенная медицинская проблема / болезнь *
              </label>
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={isAiLoading}
                className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {isAiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span>{isAiLoading ? 'AI генерирует...' : 'Сформулировать с AI'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={medicalProblem}
              onChange={(e) => setMedicalProblem(e.target.value)}
              placeholder="Например: Глиобластома, Болезнь Гентингтона..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
            {aiNotice && (
              <p className="mt-1 text-[11px] text-cyan-400 flex items-center gap-1">
                <Check className="h-3 w-3" /> {aiNotice}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              В чем нерешенный барьер / почему нет лечения? *
            </label>
            <textarea
              rows={2}
              required
              value={unresolvedBarrier}
              onChange={(e) => setUnresolvedBarrier(e.target.value)}
              placeholder="Опишите фундаментальный барьер, останавливающий клинические разработки..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Предлагаемое решение и научная гипотеза
            </label>
            <textarea
              rows={2}
              value={proposedSolution}
              onChange={(e) => setProposedSolution(e.target.value)}
              placeholder="Механизм решения (нанодоставка, Prime Editing, фаговая селекция)..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-800 hover:bg-slate-800 py-2.5 text-slate-300 font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2.5 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>Опубликовать в сети Solana</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
