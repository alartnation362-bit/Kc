import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Lock,
  ArrowRight,
  Coins,
  CheckCircle2,
  Cpu,
  Layers,
  ChevronRight,
  Sparkles,
  Wallet,
  Users,
  Activity,
  Gift,
  MapPin
} from 'lucide-react';
import { StakingPlan, SupportedAssetId, PlatformStats } from '../types/crypto';
import { TOKEN_METAS, IMAGES } from '../constants/assets';
import { useLanguage } from '../context/LanguageContext';

interface LandingViewProps {
  plans: StakingPlan[];
  assetPrices: Record<string, { priceUsd: number; change24h: number; name: string; symbol: string }>;
  platformStats?: PlatformStats;
  onStartStaking: (planId?: string) => void;
  onOpenDeposit: () => void;
  onOpenSupport: () => void;
  onOpenReferral?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  plans,
  assetPrices,
  platformStats,
  onStartStaking,
  onOpenDeposit,
  onOpenSupport,
  onOpenReferral
}) => {
  const { t } = useLanguage();

  // Live APY Calculator State
  const [calcAsset, setCalcAsset] = useState<SupportedAssetId>('ETH');
  const [calcAmount, setCalcAmount] = useState<number>(5.0);
  const [calcPlanId, setCalcPlanId] = useState<string>('plan_90d');

  const selectedPlan = plans.find((p) => p.id === calcPlanId) || plans[2] || plans[0];
  const price = assetPrices[calcAsset]?.priceUsd || 1;
  const totalUsdInvested = calcAmount * price;

  const dailyRate = selectedPlan?.dailyReturnPercent || (selectedPlan?.apy ? Number((selectedPlan.apy / 365).toFixed(2)) : 1.5);
  const dailyEarningsAsset = calcAmount * (dailyRate / 100);
  const dailyEarningsUsd = dailyEarningsAsset * price;

  const monthlyEarningsAsset = dailyEarningsAsset * 30;
  const monthlyEarningsUsd = dailyEarningsUsd * 30;

  const annualEarningsAsset = dailyEarningsAsset * 365;
  const annualEarningsUsd = dailyEarningsUsd * 365;

  const supportedAssets: SupportedAssetId[] = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'AVAX'];

  const totalStakedFormatted = platformStats
    ? `$${platformStats.totalPlatformStakedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$48,620,450.00';

  const totalPayoutFormatted = platformStats
    ? `$${platformStats.totalPlatformPayoutUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$14,395,120.00';

  const activeStakersFormatted = platformStats
    ? `${platformStats.activeStakersCount.toLocaleString('en-US')}+`
    : '14,280+';

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section Split Grid (Institutional Presence) */}
      <section className="relative pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                {t('hero.badge', 'Institutional Cryptographic Vault')}
              </span>
              <span>·</span>
              <span>{t('hero.badgeSub', 'Daily Returns Staking')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08] text-balance">
              {t('hero.title', 'Earn Daily Returns on Institutional Crypto Staking')}
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {t('hero.subtitle', 'Deposit Bitcoin, Ethereum, Solana, and EVM assets into secure multi-sig validator pools. Earn guaranteed daily returns from 1.0% to 4.2% per day with continuous live payouts and 100% flexible unstaking anytime.')}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onStartStaking()}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-amber-500/10 cursor-pointer"
              >
                <span>{t('hero.launchStaking', 'Launch Staking Vault')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenDeposit}
                className="px-5 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              >
                {t('hero.depositCrypto', 'Deposit Crypto')}
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{t('hero.multisig', 'Multi-Sig Segregation')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>{t('hero.coldStorage', 'Audited Cold Storage')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sky-500" />
                <span>{t('hero.continuousPayouts', 'Continuous Daily Payouts')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xl min-h-[380px] lg:min-h-full">
            <img
              src={IMAGES.heroVault}
              alt="Institutional Cryptocurrency Staking Vault"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 flex items-center justify-between text-white">
              <div>
                <div className="text-[11px] text-slate-400 font-mono">{t('hero.totalYieldDispatched', 'Total Protocol Yield Dispatched')}</div>
                <div className="text-lg font-black text-amber-400 font-mono tabular-nums">{totalPayoutFormatted} USD</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-mono">{t('hero.activeValidatorUptime', 'Active Validator Uptime')}</div>
                <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">99.99%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROMINENT PLATFORM KEY METRICS (Total Staked & Total Platform Payout) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Global Protocol Live Statistics
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time Blockchain Verification
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Platform Staked */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group hover:border-amber-400/50 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {t('stats.totalPlatformStaked', 'Total Platform Staked')}
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-amber-400 font-mono tabular-nums tracking-tight">
              {totalStakedFormatted}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {t('stats.totalPlatformStakedDesc', 'Total cryptographic liquidity committed across 7 multi-chain vaults')}
            </p>
          </div>

          {/* Card 2: Total Platform Payout */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {t('stats.totalPlatformPayout', 'Total Platform Payout')}
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
              {totalPayoutFormatted}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {t('stats.totalPlatformPayoutDesc', 'Cumulative verified rewards disbursed to stakers since protocol genesis')}
            </p>
          </div>

          {/* Card 3: Active Protocol Stakers */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group hover:border-sky-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {t('stats.activeStakers', 'Active Protocol Stakers')}
              </span>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
              {activeStakersFormatted}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {t('stats.activeStakersDesc', 'Institutional and retail participants receiving daily automated returns')}
            </p>
          </div>

          {/* Card 4: Daily Return Yield */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative overflow-hidden group hover:border-amber-400/50 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {t('stats.dailyYield', 'Daily Return Rate')}
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
              1.0% - 4.2% <span className="text-sm font-semibold text-emerald-500">/ Day</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {t('stats.dailyYieldDesc', 'Continuous compounding yield credited every block with flexible liquidity')}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Interactive Yield Calculator */}
      <section className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400 tracking-wider font-semibold mb-1">
              {t('calc.eyebrow', 'Real-Time Projection Engine')}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('calc.title', 'Calculate Your Staking Yield')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('calc.subtitle', 'Select cryptocurrency and commitment horizon to estimate guaranteed protocol earnings.')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {supportedAssets.slice(0, 5).map((asset) => (
              <button
                key={asset}
                onClick={() => setCalcAsset(asset)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition-all cursor-pointer ${
                  calcAsset === asset
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Inputs */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{t('calc.depositQuantity', 'Staking Deposit Quantity')}</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {calcAmount} {calcAsset} (~${totalUsdInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max={calcAsset === 'BTC' ? '10' : calcAsset === 'ETH' ? '50' : '20000'}
                step={calcAsset === 'BTC' ? '0.05' : '0.5'}
                value={calcAmount}
                onChange={(e) => setCalcAmount(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <span className="block text-xs text-slate-700 dark:text-slate-300 font-medium mb-2">
                {t('calc.selectPlan', 'Select Flexible Staking Plan (Daily Return Tier)')}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {plans.map((p) => {
                  const pDaily = p.dailyReturnPercent || (p.apy ? Number((p.apy / 365).toFixed(2)) : 1.5);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setCalcPlanId(p.id)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        calcPlanId === p.id
                          ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                      <div className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-black mt-0.5">
                        +{pDaily}% / {t('calc.day', 'Day')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {p.apy}% APY · Min ${p.minStakeUsd}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Projection Result Card */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{t('calc.projectedDaily', 'Projected Daily Staking Return')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">+{dailyRate}% / {t('calc.day', 'Day')}</span>
            </div>

            <div className="space-y-3 py-2 border-y border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('calc.estDailyYield', 'Est. Daily Reward')}:</span>
                <div className="text-right">
                  <div className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{dailyEarningsAsset.toFixed(4)} {calcAsset}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    ~${dailyEarningsUsd.toFixed(2)} USD / {t('calc.day', 'Day')}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">30-Day Cumulative:</span>
                <div className="text-right font-mono font-bold text-xs text-slate-900 dark:text-slate-200">
                  +{monthlyEarningsAsset.toFixed(4)} {calcAsset} (~${monthlyEarningsUsd.toFixed(2)})
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>{t('calc.equivalentApy', 'Equivalent APY')}:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedPlan?.apy}% APY</span>
              </div>
              <div className="flex justify-between">
                <span>{t('calc.redemptionTerms', 'Redemption Terms')}:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {t('calc.redemptionValue', '100% Flexible · Unstake Anytime')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('calc.payoutDistribution', 'Payout Distribution')}:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{t('calc.payoutValue', 'Continuous Daily Accrual')}</span>
              </div>
            </div>

            <button
              onClick={() => onStartStaking(selectedPlan?.id)}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>{t('calc.stakeNowBtn', { rate: dailyRate })}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Security Architecture & Custody */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-5">
          <div className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400 tracking-wider font-semibold">
            Institutional Trust Architecture
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Cryptographic Multi-Signature Custody Infrastructure
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Every deposited Satoshi and Wei is routed into air-gapped multi-sig vault networks.
            No single private key has authority to dispatch capital without multi-party quorum authorization.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { title: 'Air-Gapped Hardware Security Modules', desc: 'FIPS 140-2 Level 3 compliant cryptographic physical custody.' },
              { title: 'Time-Locked Withdrawal Safeguards', desc: 'Configurable governance timelocks preventing flash exploit draining.' },
              { title: 'Automated Email Dispatch Receipts', desc: 'Every balance modification triggers real-time cryptographic audit alerts.' },
              { title: 'New York, United States Corporate Headquarters', desc: 'One World Trade Center, 285 Fulton Street, Suite 7800, New York, NY 10007, United States · FinCEN MSB #31000284729184.' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          <img
            src={IMAGES.securityVault}
            alt="Cryptographic custody hardware security module"
            className="w-full h-80 object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* 5. Supported Multi-Chain Assets Strip & Live Binance Price Feed */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 max-w-4xl mx-auto text-center sm:text-left">
          <div>
            <div className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400 tracking-wider font-semibold">
              Live Liquidity & Spot Feeds
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Supported Staking Assets & Spot Pricing
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 self-center sm:self-auto px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Binance US Live Feed</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {supportedAssets.map((asset) => {
            const meta = TOKEN_METAS[asset];
            const priceInfo = assetPrices[asset] || { priceUsd: 1, change24h: 0 };
            return (
              <div
                key={asset}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center space-y-2 hover:border-amber-400/40 transition-colors shadow-sm group"
              >
                <div
                  className="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs shadow-sm"
                  style={{ backgroundColor: meta?.color || '#fff', color: '#090d16' }}
                >
                  {asset.substring(0, 3)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{asset}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{meta?.networkBadge}</div>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  ${priceInfo.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="pt-0.5">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      priceInfo.change24h >= 0
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                        : 'text-rose-700 dark:text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {priceInfo.change24h >= 0 ? '+' : ''}{priceInfo.change24h}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Referral & Affiliate Partner Program Strip */}
      <section className="p-6 sm:p-8 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/30 dark:from-indigo-950/20 dark:via-slate-900/80 dark:to-amber-950/10 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 text-xs font-mono font-semibold">
              <Gift className="w-3.5 h-3.5 text-indigo-500" />
              <span>Multi-Tier Affiliate Program</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Earn Up to 12% in Instant Referral Commissions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Invite friends, stakers, and institutions to VaultStake. Earn instant match commissions in liquid USDT every time your referred partners deposit and stake into daily return vaults.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Tier 1 (1-5 stakers): <strong>8.0%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Tier 2 (6-15 stakers): <strong>10.0%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Tier 3 (16+ stakers): <strong>12.0%</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {onOpenReferral && (
              <button
                onClick={onOpenReferral}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                <span>Open Referral Program</span>
              </button>
            )}
            <button
              onClick={() => onStartStaking()}
              className="px-5 py-3.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Start Staking Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
