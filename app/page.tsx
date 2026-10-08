'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { 
  Heart, 
  ArrowRight, 
  Sparkles, 
  Search, 
  PlusCircle, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ExternalLink,
  Loader2,
  FileText
} from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { CampaignCard } from '@/components/CampaignCard';
import { DonateModal } from '@/components/DonateModal';
import { CampaignDetailsModal } from '@/components/CampaignDetailsModal';
import { NewCampaignModal } from '@/components/NewCampaignModal';
import { WalletModal } from '@/components/WalletModal';
import { BlockchainRecordsList } from '@/components/BlockchainRecordsList';
import { INITIAL_CAMPAIGNS, INITIAL_BLOCKCHAIN_RECORDS, CATEGORY_LABELS } from '@/lib/mock-data';
import { ResearchCampaign, CategoryFilter, BlockchainRecord } from '@/lib/types';
import { getPhantomProvider, fetchSolBalance, sendMemoTransaction } from '@/lib/solana';

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<ResearchCampaign[]>(INITIAL_CAMPAIGNS);
  const [hasActivatedResults, setHasActivatedResults] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Solana & Phantom Wallet State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [phantomNotFound, setPhantomNotFound] = useState<boolean>(false);

  // Blockchain Memo writing state
  const [isWritingMemo, setIsWritingMemo] = useState<boolean>(false);
  const [lastMemoSuccess, setLastMemoSuccess] = useState<{ signature: string; text: string } | null>(null);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [blockchainRecords, setBlockchainRecords] = useState<BlockchainRecord[]>(INITIAL_BLOCKCHAIN_RECORDS);

  // Modals state
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState<boolean>(false);
  const [activeDonationCampaign, setActiveDonationCampaign] = useState<ResearchCampaign | null>(null);
  const [activeDetailsCampaign, setActiveDetailsCampaign] = useState<ResearchCampaign | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshBalance = useCallback(async () => {
    if (walletAddress) {
      const bal = await fetchSolBalance(walletAddress);
      setSolBalance(bal);
    }
  }, [walletAddress]);

  // Connect to Phantom via window.phantom.solana
  const handleConnectPhantom = async () => {
    setIsConnecting(true);
    setPhantomNotFound(false);
    setMemoError(null);

    try {
      const provider = getPhantomProvider();

      if (!provider) {
        setPhantomNotFound(true);
        setIsWalletModalOpen(true);
        setIsConnecting(false);
        return;
      }

      const response = await provider.connect();
      const pubkey = response.publicKey.toString();
      setWalletAddress(pubkey);

      const balance = await fetchSolBalance(pubkey);
      setSolBalance(balance);

      showToast(`Phantom подключен: ${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`);
    } catch (err: any) {
      console.warn('Phantom connection error:', err);
      if (err?.code === 4001 || err?.message?.includes('User rejected')) {
        showToast('Подключение отклонено пользователем в Phantom.');
      } else {
        setPhantomNotFound(true);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      const provider = getPhantomProvider();
      if (provider) {
        await provider.disconnect();
      }
    } catch (e) {
      console.error(e);
    }
    setWalletAddress(null);
    setSolBalance(null);
    showToast('Кошелёк отключен.');
  };

  // Check for already connected wallet on mount or account change
  useEffect(() => {
    const provider = getPhantomProvider();
    if (provider) {
      provider.connect({ onlyIfTrusted: true })
        .then(async (res) => {
          if (res?.publicKey) {
            const addr = res.publicKey.toString();
            setWalletAddress(addr);
            const bal = await fetchSolBalance(addr);
            setSolBalance(bal);
          }
        })
        .catch(() => {});

      const handleAccountChanged = async (publicKey: any) => {
        if (publicKey) {
          const addr = publicKey.toString();
          setWalletAddress(addr);
          const bal = await fetchSolBalance(addr);
          setSolBalance(bal);
        } else {
          setWalletAddress(null);
          setSolBalance(null);
        }
      };

      provider.on('accountChanged', handleAccountChanged);
      return () => {
        provider.removeListener('accountChanged', handleAccountChanged);
      };
    }
  }, []);

  // Primary action button handler: Send Memo transaction to Solana Devnet via connected Phantom
  const handlePrimaryButtonClick = async () => {
    setMemoError(null);
    setLastMemoSuccess(null);

    let activeProvider = getPhantomProvider();

    // If wallet is not connected yet, try connecting first
    if (!activeProvider || !activeProvider.publicKey) {
      if (!activeProvider) {
        setPhantomNotFound(true);
        setMemoError('Phantom не найден. Откройте приложение в отдельной вкладке с установленным Phantom для отправки транзакции.');
        setIsWalletModalOpen(true);
        return;
      }

      setIsConnecting(true);
      try {
        const resp = await activeProvider.connect();
        const pubkey = resp.publicKey.toString();
        setWalletAddress(pubkey);
        const bal = await fetchSolBalance(pubkey);
        setSolBalance(bal);
      } catch (err: any) {
        setIsConnecting(false);
        if (err?.code === 4001 || err?.message?.includes('User rejected')) {
          setMemoError('Пользователь отклонил подключение кошелька в Phantom.');
        } else {
          setMemoError('Не удалось подключить Phantom: ' + (err?.message || 'ошибка авторизации'));
        }
        return;
      }
      setIsConnecting(false);
      activeProvider = getPhantomProvider();
    }

    if (!activeProvider || !activeProvider.publicKey) {
      setMemoError('Кошелек Phantom не авторизован.');
      return;
    }

    setIsWritingMemo(true);
    const memoText = 'AI Medical Research Bounty: Выбор ученого для гранта на решение нерешенной медицинской проблемы';

    try {
      const signature = await sendMemoTransaction(activeProvider, memoText);

      const newRecord: BlockchainRecord = {
        id: signature,
        text: memoText,
        timestamp: new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        txSignature: signature,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      };

      setBlockchainRecords((prev) => [newRecord, ...prev]);
      setLastMemoSuccess({ signature, text: memoText });
      setHasActivatedResults(true);

      // Refresh balance after transaction fee
      refreshBalance();

      // Smooth scroll to catalog / records
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);

    } catch (err: any) {
      console.error('Memo transaction error:', err);
      if (err?.code === 4001 || err?.message?.includes('User rejected')) {
        setMemoError('Пользователь отменил транзакцию в Phantom.');
      } else if (
        err?.message?.includes('0x1') ||
        err?.message?.includes('insufficient funds') ||
        (solBalance !== null && solBalance < 0.00001)
      ) {
        setMemoError('Недостаточно SOL для оплаты сетевой комиссии Solana. Запросите бесплатный Devnet Airdrop в меню кошелька.');
      } else {
        setMemoError(`Ошибка при записи в блокчейн Solana: ${err?.message || 'Сбой подтверждения транзакции в Devnet'}`);
      }
    } finally {
      setIsWritingMemo(false);
    }
  };

  // Donation handler with SOL calculation
  const handleDonateSuccess = (
    campaignId: string,
    amountSol: number,
    amountUsd: number,
    donorName: string,
    message: string,
    txSignature?: string
  ) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          const newRaisedSol = Math.round((c.raisedSol + amountSol) * 100) / 100;
          const newRaisedUsd = c.raisedAmount + amountUsd;
          const newDonation = {
            id: `tx-${Date.now()}`,
            donorName,
            amountSol,
            amountUsd,
            timestamp: 'Только что',
            message: message || undefined,
            signature: txSignature,
          };
          return {
            ...c,
            raisedSol: newRaisedSol,
            raisedAmount: newRaisedUsd,
            donorCount: c.donorCount + 1,
            recentDonations: [newDonation, ...(c.recentDonations || [])],
          };
        }
        return c;
      })
    );

    // Also record donation as blockchain record
    if (txSignature) {
      const camp = campaigns.find((c) => c.id === campaignId);
      const donationRecord: BlockchainRecord = {
        id: txSignature,
        text: `Пожертвование ${amountSol} SOL в фонд: ${camp?.title || 'Исследование'} (${donorName})`,
        timestamp: new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        txSignature,
        explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
      };
      setBlockchainRecords((prev) => [donationRecord, ...prev]);
    }

    showToast(`Успешно пожертвовано ${amountSol} SOL в фонд исследования!`);
  };

  const handleAddNewCampaign = (newCamp: ResearchCampaign) => {
    setCampaigns((prev) => [newCamp, ...prev]);
    setHasActivatedResults(true);
    showToast('Сбор средств для исследователя успешно создан в сети Solana!');
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.medicalProblem.toLowerCase().includes(query) ||
      c.scientist.name.toLowerCase().includes(query) ||
      c.scientist.solanaAddress.toLowerCase().includes(query) ||
      c.unresolvedBarrier.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const totalFundedSol = campaigns.reduce((acc, c) => acc + c.raisedSol, 0);
  const totalFundedUsd = campaigns.reduce((acc, c) => acc + c.raisedAmount, 0);
  const totalDonors = campaigns.reduce((acc, c) => acc + c.donorCount, 0);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
      {/* Top Bar with working Phantom button and SOL devnet balance */}
      <TopBar
        walletAddress={walletAddress}
        solBalance={solBalance}
        isConnecting={isConnecting}
        phantomNotFound={phantomNotFound}
        onConnect={handleConnectPhantom}
        onOpenDetails={() => setIsWalletModalOpen(true)}
        onNewCampaign={() => setIsNewCampaignOpen(true)}
      />

      {/* Main Screen Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-800/80 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {/* Subtle laboratory ambient background */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <Image
              src="/images/medical_bounty_hero_1791372988063.jpg"
              alt="Medical Research Laboratory"
              fill
              priority
              className="object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/80 via-[#07090e]/95 to-[#07090e]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            {/* Header / Title required */}
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
              AI Medical Research Bounty
            </h1>

            {/* Exactly one line description required */}
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Платформа сбора средств для ученых на решение нерешенных медицинских проблем и неизлечимых болезней.
            </p>

            {/* Primary Action Button requested: Sends Memo transaction in Solana devnet via Phantom */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={handlePrimaryButtonClick}
                disabled={isWritingMemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-75 disabled:hover:bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all shadow-lg shadow-cyan-950 hover:shadow-cyan-900/50 cursor-pointer active:scale-95"
              >
                {isWritingMemo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Записываем в блокчейн…</span>
                  </>
                ) : (
                  <>
                    <span>Выбрать ученого кому пожертвовать</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsNewCampaignOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700/80 hover:border-slate-600 bg-slate-900/70 hover:bg-slate-800/80 px-5 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-cyan-400" />
                <span>Начать сбор (для исследователей)</span>
              </button>
            </div>

            {/* Blockchain Transaction Success Notice */}
            {lastMemoSuccess && (
              <div className="mt-6 mx-auto max-w-lg rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-xs text-emerald-200 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2 text-left">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">Записано в блокчейн</span>
                    <span className="text-[11px] text-emerald-300/80 font-mono">
                      Инструкция Memo подтверждена в Solana Devnet
                    </span>
                  </div>
                </div>
                <a
                  href={`https://explorer.solana.com/tx/${lastMemoSuccess.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-900/40 hover:bg-emerald-800/50 px-3 py-1.5 font-mono text-emerald-200 hover:text-white transition-colors shrink-0"
                >
                  <span>Посмотреть запись</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Blockchain Transaction Error Notice in clear Russian */}
            {memoError && (
              <div className="mt-6 mx-auto max-w-lg rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200 animate-fade-in flex items-start justify-between gap-3 shadow-lg">
                <div className="flex items-start gap-2.5 text-left">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-rose-100 block mb-0.5">Сообщение системы:</span>
                    <p className="text-rose-200/90 leading-relaxed">{memoError}</p>
                  </div>
                </div>
                {memoError.includes('Airdrop') && (
                  <button
                    type="button"
                    onClick={() => setIsWalletModalOpen(true)}
                    className="rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-2.5 py-1 text-[11px] font-medium text-rose-100 shrink-0"
                  >
                    Запросить SOL
                  </button>
                )}
              </div>
            )}

            {/* Phantom / Solana Devnet Telemetry Ribbon (Tabular, Unboxed) */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-slate-500">Собрано ученым:</span>{' '}
                <span className="text-cyan-400 font-bold tabular-nums">
                  {totalFundedSol.toFixed(1)} SOL
                </span>{' '}
                <span className="text-slate-500 text-[11px]">
                  (≈${totalFundedUsd.toLocaleString('en-US')})
                </span>
              </div>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <div>
                <span className="text-slate-500">Поддержано донорами:</span>{' '}
                <span className="text-white font-bold tabular-nums">{totalDonors}</span>
              </div>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <div>
                <span className="text-slate-500">Открытых грантов:</span>{' '}
                <span className="text-white font-bold tabular-nums">{campaigns.length}</span>
              </div>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <div className="flex items-center gap-1.5 text-cyan-500">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Solana Devnet Memo</span>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section
          ref={resultsRef}
          id="catalog"
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
        >
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>КАТАЛОГ ИССЛЕДОВАТЕЛЬСКИХ ПРОЕКТОВ (SOLANA)</span>
                {hasActivatedResults && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Тестовые данные загружены
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Ученые и нерешенные медицинские вызовы
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl">
                Выберите научную группу и переведите SOL через Phantom напрямую на адрес лаборатории.
              </p>
            </div>

            {/* Live Search */}
            <div className="w-full md:w-72 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по болезни, ученому, адресу..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Filter Controls */}
          <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {(
              [
                'all',
                'oncology',
                'neurology',
                'genetics',
                'infectious',
                'rare_diseases',
              ] as CategoryFilter[]
            ).map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900'
                  }`}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              );
            })}
          </div>

          {/* Grid of Results */}
          {filteredCampaigns.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  onDonate={(c) => setActiveDonationCampaign(c)}
                  onViewDetails={(c) => setActiveDetailsCampaign(c)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center py-16 rounded-xl border border-slate-800/80 bg-slate-900/20">
              <FlaskConical className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-white">
                Исследования не найдены
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Попробуйте изменить поисковый запрос или выбрать другую категорию.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                Сбросить фильтры
              </button>
            </div>
          )}

          {/* Blockchain Records Ledger (List of all records: text, time, link) */}
          <BlockchainRecordsList records={blockchainRecords} />

          {/* Bottom helper card for scientists */}
          <div className="mt-12 rounded-xl border border-slate-800/90 bg-gradient-to-r from-slate-900/70 to-[#0e1424] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                ДЛЯ ИССЛЕДОВАТЕЛЬСКИХ КОМАНД
              </span>
              <h3 className="text-lg font-semibold text-white">
                Занимаетесь нерешенной патологией и не хватает средств?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Опубликуйте свою научную гипотезу и привяжите Solana кошелек лаборатории. Получайте прямое крипто-финансирование без бюрократических задержек грантовых фондов.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewCampaignOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-2.5 text-xs font-semibold text-white transition-colors shrink-0"
            >
              <PlusCircle className="h-4 w-4 text-cyan-400" />
              <span>Создать научный сбор</span>
            </button>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-300 font-semibold">AI Medical Research Bounty</span>
            <span>·</span>
            <span>Solana Devnet Settlement</span>
          </div>
          <div>
            <span>Прямые смарт-транзакции в кошельки ученых через Phantom</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-cyan-500/40 bg-slate-900 p-4 shadow-xl text-xs text-cyan-200 flex items-center gap-2.5">
          <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <DonateModal
        campaign={activeDonationCampaign}
        isOpen={Boolean(activeDonationCampaign)}
        walletAddress={walletAddress}
        solBalance={solBalance}
        onClose={() => setActiveDonationCampaign(null)}
        onDonateSuccess={handleDonateSuccess}
        onConnectWallet={handleConnectPhantom}
        onRefreshBalance={refreshBalance}
      />

      <CampaignDetailsModal
        campaign={activeDetailsCampaign}
        isOpen={Boolean(activeDetailsCampaign)}
        onClose={() => setActiveDetailsCampaign(null)}
        onOpenDonate={(c) => setActiveDonationCampaign(c)}
      />

      <NewCampaignModal
        isOpen={isNewCampaignOpen}
        walletAddress={walletAddress}
        onClose={() => setIsNewCampaignOpen(false)}
        onAddCampaign={handleAddNewCampaign}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        walletAddress={walletAddress}
        solBalance={solBalance}
        phantomNotFound={phantomNotFound}
        onConnect={handleConnectPhantom}
        onDisconnect={handleDisconnectWallet}
        onRefreshBalance={refreshBalance}
      />
    </div>
  );
}
