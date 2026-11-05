import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Coins,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Activity,
  Search,
  Copy,
  Check,
  Calendar
} from 'lucide-react';
import {
  SupportedAssetId,
  StakingPlan,
  StakePosition,
  Transaction,
  DepositAddressConfig,
  PlatformStats
} from '../types/crypto';
import { TOKEN_METAS, IMAGES } from '../constants/assets';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ExportTaxReportModal } from '../components/ExportTaxReportModal';

interface DashboardViewProps {
  plans: StakingPlan[];
  depositAddresses: Record<string, DepositAddressConfig>;
  assetPrices: Record<string, { priceUsd: number; change24h: number; name: string; symbol: string; network: string; withdrawalFee: number }>;
  platformStats?: PlatformStats;
  onOpenDeposit: (asset?: SupportedAssetId) => void;
  onOpenWithdraw: (asset?: SupportedAssetId) => void;
  onOpenStake: (planId?: string, asset?: SupportedAssetId) => void;
  onNavigateToEmails: () => void;
  onOpenReferral?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plans,
  depositAddresses,
  assetPrices,
  platformStats,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenStake,
  onNavigateToEmails,
  onOpenReferral
}) => {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [dashboardTab, setDashboardTab] = useState<'portfolio' | 'history'>('portfolio');
  const [stakes, setStakes] = useState<(StakePosition & { currentAccruedRewards?: number; currentAccruedUsd?: number })[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'stake' | 'reward_claim'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claimingStakeId, setClaimingStakeId] = useState<string | null>(null);
  const [unstakingStakeId, setUnstakingStakeId] = useState<string | null>(null);
  const [isExportTaxModalOpen, setIsExportTaxModalOpen] = useState(false);

  // Live real-time reward ticker state (ticks every second!)
  const [liveRewardTick, setLiveRewardTick] = useState(0);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [stakesRes, txRes] = await Promise.all([
        api.staking.getMyStakes(),
        api.wallet.getTransactions()
      ]);
      setStakes(stakesRes.stakes);
      setTransactions(txRes.transactions);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  // Real-time second tick to animate yield numbers continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveRewardTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute portfolio metrics
  let totalWalletUsd = 0;
  if (user?.walletBalances) {
    for (const [asset, balance] of Object.entries(user.walletBalances)) {
      const price = assetPrices[asset]?.priceUsd || 0;
      totalWalletUsd += balance * price;
    }
  }

  let totalStakedUsd = 0;
  let totalAccruedRewardsUsd = 0;
  const activeStakes = stakes.filter((s) => s.status === 'active');

  for (const s of activeStakes) {
    const price = assetPrices[s.assetId]?.priceUsd || 1;
    totalStakedUsd += s.amount * price;
    // Real-time calculation with live tick based on daily returns
    const lastClaim = new Date(s.lastClaimDate || s.startDate).getTime();
    const elapsedSeconds = Math.max(0, (Date.now() - lastClaim) / 1000);
    const dailyRate = (s.dailyReturnPercent || (s.apy / 365) || 1.0) / 100;
    const continuousYield = s.amount * dailyRate * (elapsedSeconds / 86400);
    const totalYield = (s.accruedRewards || 0) + continuousYield;
    totalAccruedRewardsUsd += totalYield * price;
  }

  const netPortfolioUsd = totalWalletUsd + totalStakedUsd + totalAccruedRewardsUsd;

  const handleClaimRewards = async (stakeId: string) => {
    setClaimingStakeId(stakeId);
    try {
      await api.staking.claimRewards(stakeId);
      await Promise.all([fetchDashboardData(), refreshUser()]);
    } catch (err: any) {
      alert(err.message || 'Failed to claim rewards');
    } finally {
      setClaimingStakeId(null);
    }
  };

  const handleUnstake = async (stakeId: string) => {
    if (!confirm('Are you sure you want to unstake? Principal and final yield will be returned to your wallet.')) return;
    setUnstakingStakeId(stakeId);
    try {
      await api.staking.unstake(stakeId);
      await Promise.all([fetchDashboardData(), refreshUser()]);
    } catch (err: any) {
      alert(err.message || 'Failed to unstake');
    } finally {
      setUnstakingStakeId(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Financial statistics across transaction history
  const totalDepositedUsd = transactions
    .filter((t) => t.type === 'deposit' && (t.status === 'approved' || t.status === 'completed'))
    .reduce((sum, t) => sum + (t.amountUsd || 0), 0);

  const totalWithdrawnUsd = transactions
    .filter((t) => t.type === 'withdrawal' && (t.status === 'approved' || t.status === 'completed'))
    .reduce((sum, t) => sum + (t.amountUsd || 0), 0);

  const totalRewardsClaimedUsd = transactions
    .filter((t) => t.type === 'reward_claim' && (t.status === 'approved' || t.status === 'completed'))
    .reduce((sum, t) => sum + (t.amountUsd || 0), 0);

  const totalDepositsCount = transactions.filter((t) => t.type === 'deposit').length;
  const totalWithdrawalsCount = transactions.filter((t) => t.type === 'withdrawal').length;
  const totalRewardsCount = transactions.filter((t) => t.type === 'reward_claim').length;

  const filteredTransactions = transactions.filter((t) => {
    if (txFilter !== 'all') {
      if (txFilter === 'stake') {
        if (t.type !== 'stake' && t.type !== 'unstake') return false;
      } else if (t.type !== txFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesAsset = t.assetId?.toLowerCase().includes(q);
      const matchesId = t.id?.toLowerCase().includes(q);
      const matchesHash = t.txHash?.toLowerCase().includes(q);
      const matchesToAddress = t.toAddress?.toLowerCase().includes(q);
      const matchesNetwork = t.network?.toLowerCase().includes(q);
      const matchesType = t.type?.toLowerCase().includes(q);
      return Boolean(matchesAsset || matchesId || matchesHash || matchesToAddress || matchesNetwork || matchesType);
    }
    return true;
  });

  const supportedAssets: SupportedAssetId[] = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'AVAX'];

  const totalPlatformStakedUsdDisplay = platformStats
    ? `$${(platformStats.totalPlatformStakedUsd / 1_000_000).toFixed(2)}M`
    : '$48.62M';

  const totalPlatformPayoutUsdDisplay = platformStats
    ? `$${(platformStats.totalPlatformPayoutUsd / 1_000_000).toFixed(2)}M`
    : '$14.40M';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 0. PROMINENT PROTOCOL ECOSYSTEM LIQUIDITY & TOTAL PAYOUT STRIP */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('dash.platformLiquidityBanner', 'Protocol Ecosystem Liquidity')}</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Live Multi-Chain
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-signature segregated cold vaults supporting daily reward payouts across 7 blockchain networks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-8 font-mono shrink-0">
          <div>
            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
              {t('dash.globalTvl', 'Global Total Staked')}
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-amber-400 tabular-nums">
              {totalPlatformStakedUsdDisplay}
            </div>
          </div>
          <div className="h-9 w-px bg-slate-200 dark:border-slate-800"></div>
          <div>
            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
              {t('dash.globalPayout', 'Global Total Paid Out')}
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {totalPlatformPayoutUsdDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Dashboard User KPI Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 relative overflow-hidden shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
            {t('dash.availableBalance', 'Total Net Portfolio')}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
            ${netPortfolioUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Liquid:</span>
            <span className="text-slate-900 dark:text-white font-medium">
              ${totalWalletUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Active Vault</span>
          </div>
        </div>

        {/* Total Staked Assets */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 relative overflow-hidden shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
            {t('dash.totalStaked', 'Total Value Locked (Staked)')}
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums tracking-tight">
            ${totalStakedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Positions:</span>
            <span className="text-slate-900 dark:text-white font-semibold">{activeStakes.length} Active Contracts</span>
          </div>
        </div>

        {/* Real-Time Live Accrued Yield */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              {t('dash.totalEarned', 'Accrued Yield Rewards')}
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              Live Ticking
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
            +${totalAccruedRewardsUsd.toFixed(4)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Auto-accruing</span>
            <span>·</span>
            <span>Unlocks per block</span>
          </div>
        </div>

        {/* Quick Action Hub */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col justify-between shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Capital Actions
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenDeposit()}
              className="py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{t('dash.deposit', 'Deposit')}</span>
            </button>
            <button
              onClick={() => onOpenWithdraw()}
              className="py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{t('dash.withdraw', 'Withdraw')}</span>
            </button>
          </div>
          <button
            onClick={() => setIsExportTaxModalOpen(true)}
            className="w-full mt-2 py-1.5 px-3 rounded-lg border border-emerald-300 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t('dash.exportTax', 'Tax & Staking CSV Export')}</span>
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setDashboardTab('portfolio')}
            className={`pb-3 px-2 sm:px-3 flex items-center gap-2 text-sm sm:text-base font-bold transition-all border-b-2 cursor-pointer ${
              dashboardTab === 'portfolio'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{t('dash.tabPortfolio', 'Portfolio & Staking Pools')}</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {activeStakes.length} Active
            </span>
          </button>

          <button
            onClick={() => setDashboardTab('history')}
            className={`pb-3 px-2 sm:px-3 flex items-center gap-2 text-sm sm:text-base font-bold transition-all border-b-2 cursor-pointer ${
              dashboardTab === 'history'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{t('dash.tabHistory', 'Ledger & Earning History')}</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              {transactions.length} Records
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 pb-2 self-end sm:self-auto flex-wrap">
          {onOpenReferral && (
            <button
              onClick={onOpenReferral}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('dash.referralProg', 'Referral Program (8%)')}</span>
            </button>
          )}
          <button
            onClick={() => setIsExportTaxModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('dash.exportTax', 'Export Tax & Staking CSV')}</span>
          </button>
          <button
            onClick={() => fetchDashboardData()}
            disabled={isLoadingData}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            title="Refresh live blockchain ledger data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ================= TAB 1: PORTFOLIO & STAKING POOLS ================= */}
      {dashboardTab === 'portfolio' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Multi-Chain Liquid Balances Ledger */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Multi-Chain Assets Ledger</h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Binance US Live Feed
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Available unallocated funds ready for staking or withdrawal</p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {supportedAssets.length} Chains Integrated · Spot Prices Synced
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {supportedAssets.map((asset) => {
                const meta = TOKEN_METAS[asset];
                const priceInfo = assetPrices[asset] || { priceUsd: 1, change24h: 0 };
                const balance = user?.walletBalances?.[asset] || 0;
                const balanceUsd = balance * priceInfo.priceUsd;

                return (
                  <div
                    key={asset}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: meta?.color || '#cbd5e1' }}
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{asset}</span>
                      </div>
                      <span className={`text-[10px] font-mono ${priceInfo.change24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {priceInfo.change24h >= 0 ? '+' : ''}{priceInfo.change24h}%
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums truncate">
                        {balance.toFixed(4)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        ${balanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenDeposit(asset)}
                        className="flex-1 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                      >
                        Deposit
                      </button>
                      <button
                        onClick={() => onOpenStake(undefined, asset)}
                        className="flex-1 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        Stake
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Staking Positions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {t('dash.activePoolsTitle', 'Active Flexible Staking Positions')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('dash.unstakeAnytimeNotice', 'All plans support flexible on-demand unstaking with zero lock lockup penalty.')}
                </p>
              </div>
              <button
                onClick={() => onOpenStake()}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Open New Stake</span>
              </button>
            </div>

            {activeStakes.length === 0 ? (
              <div className="p-10 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
                <Coins className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300">No Active Staking Contracts</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Allocate your idle cryptocurrency into our institutional validator pools to start earning daily returns from 1.0% to 4.2%.
                </p>
                <button
                  onClick={() => onOpenStake()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Explore Staking Plans
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeStakes.map((stake) => {
                  const meta = TOKEN_METAS[stake.assetId];
                  const price = assetPrices[stake.assetId]?.priceUsd || 1;

                  // Continuous real-time rewards calculation based on daily returns
                  const lastClaim = new Date(stake.lastClaimDate || stake.startDate).getTime();
                  const elapsedSeconds = Math.max(0, (Date.now() - lastClaim) / 1000);
                  const dailyRatePercent = stake.dailyReturnPercent || (stake.apy ? Number((stake.apy / 365).toFixed(2)) : 1.5);
                  const dailyRate = dailyRatePercent / 100;
                  const continuousYield = stake.amount * dailyRate * (elapsedSeconds / 86400);
                  const liveAccruedRewards = (stake.accruedRewards || 0) + continuousYield;
                  const liveAccruedUsd = liveAccruedRewards * price;

                  const dailyYieldAsset = stake.amount * dailyRate;
                  const dailyYieldUsd = dailyYieldAsset * price;

                  return (
                    <div
                      key={stake.id}
                      className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: meta?.color || '#cbd5e1' }}
                            />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{stake.assetId}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">· {stake.planName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                              +{dailyRatePercent}% / Day
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{stake.apy}% APY</div>
                          </div>
                        </div>

                        {/* Staked Principal */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800/80 space-y-1">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
                            Staked Principal
                          </div>
                          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                            {stake.amount} {stake.assetId}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            ≈ ${(stake.amount * price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </div>
                        </div>

                        {/* Daily Return Rate Strip */}
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Daily Return Payout:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            +{dailyYieldAsset.toFixed(4)} {stake.assetId}/day (~${dailyYieldUsd.toFixed(2)})
                          </span>
                        </div>

                        {/* Live Accrued Yield Box */}
                        <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">
                              Live Accrued Daily Yield
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">Continuous Block Yield</span>
                          </div>
                          <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                            +{liveAccruedRewards.toFixed(6)} {stake.assetId}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                            ≈ +${liveAccruedUsd.toFixed(2)} USD
                          </div>
                        </div>

                        {/* Lock Timeline */}
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                          <span>Redemption:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            100% Flexible · Unstake Anytime
                          </span>
                        </div>
                      </div>

                      {/* Actions: Claim Yield & Unstake */}
                      <div className="pt-2 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => handleClaimRewards(stake.id)}
                          disabled={claimingStakeId === stake.id || liveAccruedRewards < 0.000001}
                          className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{claimingStakeId === stake.id ? 'Claiming...' : t('dash.claimRewards', 'Claim Rewards')}</span>
                        </button>

                        <button
                          onClick={() => handleUnstake(stake.id)}
                          disabled={unstakingStakeId === stake.id}
                          className="py-2 px-3 text-xs font-semibold rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                          title="Unstake principal and accrued yield at any time"
                        >
                          {unstakingStakeId === stake.id ? 'Unstaking...' : t('dash.unstakePosition', 'Unstake')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Staking Plans Catalog */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Available Staking Plans</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Institutional tier multipliers with flexible daily compounding</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {plans.map((plan) => {
                const planDaily = plan.dailyReturnPercent || (plan.apy ? Number((plan.apy / 365).toFixed(2)) : 1.5);
                return (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${
                      plan.isPopular
                        ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-white dark:to-slate-900/80 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{plan.name}</span>
                        {plan.isPopular && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase font-mono">
                            Popular
                          </span>
                        )}
                      </div>

                      <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                        +{planDaily}% <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ Day</span>
                      </div>

                      <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {plan.apy}% APY Equivalent
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Min ${plan.minStakeUsd} · 100% Flexible Unstaking
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3">
                      <button
                        onClick={() => onOpenStake(plan.id)}
                        className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Stake in this Pool
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Ledger Preview Banner */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Audit & Staking Records Available</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Access complete multi-chain deposit confirmations, withdrawal payouts, daily yield accruals, and tax CSV export.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDashboardTab('history')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
            >
              <span>{t('dash.tabHistory', 'Open Ledger & Earning History')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DEDICATED LEDGER & EARNING HISTORY ================= */}
      {dashboardTab === 'history' && (
        <div className="space-y-8 animate-fadeIn">
          {/* 1. FINANCIAL METRICS AUDIT STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                  Total Deposited
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {totalDepositsCount} Deposits
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                ${totalDepositedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total verified on-chain capital ingested</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                  Total Withdrawn
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {totalWithdrawalsCount} Payouts
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                ${totalWithdrawnUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Liquid capital returned to external wallets</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                  Total Rewards Paid Out
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {totalRewardsCount} Claims
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                ${totalRewardsClaimedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Staking profits harvested to liquid balance</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent dark:bg-slate-900/80 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase font-mono">
                  Live Accrued Daily Yield
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 animate-pulse">
                  Live Ticking
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                +${totalAccruedRewardsUsd.toFixed(4)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Continuously auto-generating per block</p>
            </div>
          </div>

          {/* 2. STAKING EARNING HISTORY & ACTIVE YIELD SCHEDULES TABLE */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Staking Earning History & Yield Schedules</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time yield compounding velocity, claim intervals, and contract redemption status
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenStake()}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Stake Additional Capital</span>
                </button>
              </div>
            </div>

            {stakes.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-500 text-xs space-y-2">
                <p>No staking positions recorded on this account yet.</p>
                <button
                  onClick={() => onOpenStake()}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Start Staking Now
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Staking Pool / Contract</th>
                        <th className="py-3 px-4">Daily Yield Rate</th>
                        <th className="py-3 px-4 text-right">Staked Principal</th>
                        <th className="py-3 px-4 text-right">Yield Velocity</th>
                        <th className="py-3 px-4 text-right">Accrued Rewards</th>
                        <th className="py-3 px-4">Started / Last Claim</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Instant Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {stakes.map((stake) => {
                        const meta = TOKEN_METAS[stake.assetId];
                        const price = assetPrices[stake.assetId]?.priceUsd || 1;
                        const lastClaim = new Date(stake.lastClaimDate || stake.startDate).getTime();
                        const elapsedSeconds = Math.max(0, (Date.now() - lastClaim) / 1000);
                        const dailyRatePercent = stake.dailyReturnPercent || (stake.apy ? Number((stake.apy / 365).toFixed(2)) : 1.5);
                        const dailyRate = dailyRatePercent / 100;
                        const continuousYield = stake.status === 'active' ? stake.amount * dailyRate * (elapsedSeconds / 86400) : 0;
                        const liveAccruedRewards = (stake.accruedRewards || 0) + continuousYield;
                        const liveAccruedUsd = liveAccruedRewards * price;

                        const dailyYieldAsset = stake.amount * dailyRate;
                        const dailyYieldUsd = dailyYieldAsset * price;

                        const isActive = stake.status === 'active';

                        return (
                          <tr key={stake.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: meta?.color || '#cbd5e1' }}
                                />
                                <div>
                                  <div className="font-sans font-bold text-slate-900 dark:text-white">
                                    {stake.assetId} · {stake.planName}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">ID: {stake.id.substring(0, 12)}...</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                +{dailyRatePercent}% / Day
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">{stake.apy}% APY</div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                                {stake.amount} {stake.assetId}
                              </div>
                              <div className="text-[11px] text-slate-500 tabular-nums">
                                ${(stake.amount * price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {isActive ? (
                                <>
                                  <div className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                                    +{dailyYieldAsset.toFixed(4)}/day
                                  </div>
                                  <div className="text-[10px] text-slate-500 tabular-nums">
                                    +${dailyYieldUsd.toFixed(2)}/day
                                  </div>
                                </>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                +{liveAccruedRewards.toFixed(6)} {stake.assetId}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                                ≈ +${liveAccruedUsd.toFixed(2)} USD
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                              <div>Started: {new Date(stake.startDate).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-500">
                                Last claim: {new Date(stake.lastClaimDate || stake.startDate).toLocaleDateString()}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                                  isActive
                                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {stake.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {isActive ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleClaimRewards(stake.id)}
                                    disabled={claimingStakeId === stake.id || liveAccruedRewards < 0.000001}
                                    className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded transition-colors disabled:opacity-40 flex items-center gap-1 shadow-sm cursor-pointer"
                                    title="Harvest accrued daily earnings into your liquid multi-chain wallet"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>{claimingStakeId === stake.id ? 'Claiming...' : 'Claim'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleUnstake(stake.id)}
                                    disabled={unstakingStakeId === stake.id}
                                    className="py-1 px-2 border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-300 hover:text-amber-500 font-semibold text-[11px] rounded transition-colors cursor-pointer"
                                    title="Unstake principal back to wallet"
                                  >
                                    Unstake
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500">Contract Closed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 3. MASTER TRANSACTION LEDGER TABLE (Deposits, Withdrawals, Reward Payouts, Stakes) */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span>Staking Deposits, Withdrawals & Reward Payouts Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Filterable real-time ledger with immutable cryptographic confirmation hashes
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExportTaxModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('dash.exportTax', 'Export Tax & Staking CSV')}</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar Strip */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
                {(
                  [
                    { id: 'all', label: 'All Activities', count: transactions.length },
                    { id: 'deposit', label: 'Deposits', count: totalDepositsCount },
                    { id: 'withdrawal', label: 'Withdrawals', count: totalWithdrawalsCount },
                    { id: 'reward_claim', label: 'Reward Payouts', count: totalRewardsCount },
                    { id: 'stake', label: 'Stakes & Unstakes', count: transactions.filter((t) => t.type === 'stake' || t.type === 'unstake').length }
                  ] as const
                ).map((filterItem) => (
                  <button
                    key={filterItem.id}
                    onClick={() => setTxFilter(filterItem.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                      txFilter === filterItem.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{filterItem.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                      {filterItem.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Live Search Input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search TXID, asset, hash, address..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Complete Transaction Table */}
            {filteredTransactions.length === 0 ? (
              <div className="p-10 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-500 text-xs space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <p>No transactions match the selected filter or search criteria.</p>
                {(txFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setTxFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-semibold text-xs"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Event / Reference ID</th>
                        <th className="py-3 px-4">Asset & Network</th>
                        <th className="py-3 px-4 text-right">Transaction Amount</th>
                        <th className="py-3 px-4 text-right">Value (USD)</th>
                        <th className="py-3 px-4">Hash / Destination Address</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {filteredTransactions.map((tx) => {
                        const isPending = tx.status === 'pending';
                        const isApproved = tx.status === 'approved' || tx.status === 'completed';
                        const isRejected = tx.status === 'rejected';

                        const isDeposit = tx.type === 'deposit';
                        const isWithdrawal = tx.type === 'withdrawal';
                        const isReward = tx.type === 'reward_claim';
                        const isStake = tx.type === 'stake' || tx.type === 'unstake';

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isDeposit
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : isWithdrawal
                                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                      : isReward
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                  }`}
                                >
                                  {isDeposit && <ArrowDownLeft className="w-3.5 h-3.5" />}
                                  {isWithdrawal && <ArrowUpRight className="w-3.5 h-3.5" />}
                                  {isReward && <Sparkles className="w-3.5 h-3.5" />}
                                  {isStake && <Coins className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                  <div className="font-sans font-bold text-slate-900 dark:text-white capitalize">
                                    {tx.type === 'reward_claim' ? 'Daily Yield Payout' : tx.type.replace('_', ' ')}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                    <span>{tx.id.substring(0, 14)}...</span>
                                    <button
                                      onClick={() => handleCopy(tx.id, tx.id)}
                                      className="hover:text-slate-700 dark:hover:text-slate-300"
                                      title="Copy Transaction ID"
                                    >
                                      {copiedId === tx.id ? (
                                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-sans font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: TOKEN_METAS[tx.assetId]?.color || '#cbd5e1' }}
                                />
                                <span>{tx.assetId}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">{tx.network}</div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <span
                                className={`font-bold tabular-nums ${
                                  isDeposit || isReward
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : isWithdrawal
                                    ? 'text-slate-900 dark:text-slate-200'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {isDeposit || isReward ? '+' : isWithdrawal ? '-' : ''}
                                {tx.amount} {tx.assetId}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                              ${tx.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            <td className="py-3.5 px-4 max-w-[220px]">
                              {tx.txHash ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-600 dark:text-amber-400 truncate block font-mono text-[11px]" title={tx.txHash}>
                                    TX: {tx.txHash.substring(0, 10)}...{tx.txHash.slice(-6)}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(tx.txHash!, `hash-${tx.id}`)}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
                                    title="Copy transaction hash"
                                  >
                                    {copiedId === `hash-${tx.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : tx.toAddress ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-700 dark:text-slate-300 truncate block font-mono text-[11px]" title={tx.toAddress}>
                                    To: {tx.toAddress.substring(0, 10)}...
                                  </span>
                                  <button
                                    onClick={() => handleCopy(tx.toAddress!, `addr-${tx.id}`)}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
                                    title="Copy address"
                                  >
                                    {copiedId === `addr-${tx.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[11px] font-mono">{tx.network} Internal Settlement</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                                  isApproved
                                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    : isPending
                                    ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                                    : 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                                }`}
                              >
                                {isApproved && <CheckCircle2 className="w-2.5 h-2.5" />}
                                {isPending && <Clock className="w-2.5 h-2.5 animate-spin" />}
                                <span>{tx.status}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 text-[11px] tabular-nums">
                              <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax & Staking CSV Export Modal */}
      <ExportTaxReportModal
        isOpen={isExportTaxModalOpen}
        onClose={() => setIsExportTaxModalOpen(false)}
        transactions={transactions}
        stakes={stakes}
        assetPrices={assetPrices}
      />
    </div>
  );
};
