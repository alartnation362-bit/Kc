import React, { useState } from 'react';
import { X, Check, AlertCircle, TrendingUp, Calendar, ShieldCheck } from 'lucide-react';
import { SupportedAssetId, StakingPlan } from '../types/crypto';
import { TOKEN_METAS } from '../constants/assets';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface StakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: StakingPlan[];
  initialPlanId?: string;
  initialAsset?: SupportedAssetId;
  assetPrices: Record<string, { priceUsd: number; change24h: number; name: string; symbol: string }>;
  onStakedSuccess?: () => void;
}

export const StakingModal: React.FC<StakingModalProps> = ({
  isOpen,
  onClose,
  plans,
  initialPlanId,
  initialAsset = 'ETH',
  assetPrices,
  onStakedSuccess
}) => {
  const { user, refreshUser } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAssetId>(initialAsset);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId || plans[1]?.id || plans[0]?.id || 'plan_30d');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen) return null;

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const availableBalance = user?.walletBalances?.[selectedAsset] || 0;
  const assetPrice = assetPrices[selectedAsset]?.priceUsd || 1;

  const numAmount = parseFloat(amount || '0');
  const amountUsd = numAmount * assetPrice;

  // Projected rewards based on daily returns
  const dailyRatePercent = currentPlan?.dailyReturnPercent || (currentPlan?.apy ? Number((currentPlan.apy / 365).toFixed(2)) : 1.5);
  const dailyRate = dailyRatePercent / 100;
  const dailyYieldAsset = numAmount * dailyRate;
  const dailyYieldUsd = dailyYieldAsset * assetPrice;
  const monthlyYieldAsset = dailyYieldAsset * 30;
  const monthlyYieldUsd = dailyYieldUsd * 30;
  const annualYieldAsset = dailyYieldAsset * 365;
  const annualYieldUsd = dailyYieldUsd * 365;

  const handlePercentage = (pct: number) => {
    const val = (availableBalance * pct) / 100;
    setAmount(val > 0 ? Number(val.toFixed(6)).toString() : '0');
  };

  const handleStakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please specify a staking amount greater than 0.');
      return;
    }

    if (numAmount > availableBalance) {
      setErrorMsg(
        `Insufficient available balance. You have ${availableBalance.toFixed(4)} ${selectedAsset} in your wallet.`
      );
      return;
    }

    if (amountUsd < currentPlan.minStakeUsd) {
      setErrorMsg(
        `Minimum staking threshold for ${currentPlan.name} is $${currentPlan.minStakeUsd.toLocaleString()} USD (~${(
          currentPlan.minStakeUsd / assetPrice
        ).toFixed(4)} ${selectedAsset}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.staking.createStake(selectedAsset, currentPlan.id, numAmount);
      setSuccessData(res.stake);
      if (onStakedSuccess) onStakedSuccess();
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Staking transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    setAmount('');
    setErrorMsg(null);
    onClose();
  };

  const supportedAssets: SupportedAssetId[] = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'AVAX'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 my-8 animate-in fade-in duration-200 text-slate-900 dark:text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Initialize Staking Position</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">100% Flexible Staking · Unstake Anytime</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successData ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Daily Staking Position Activated</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                You have deposited <strong className="text-amber-400">{successData.amount} {successData.assetId}</strong> into <strong className="text-white">{successData.planName}</strong> earning <strong className="text-emerald-400">+{successData.dailyReturnPercent || (successData.apy ? Number((successData.apy / 365).toFixed(2)) : 1.5)}% daily returns</strong> with instant flexible unstaking.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-left text-xs space-y-1.5 max-w-sm mx-auto font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Contract ID:</span> <span className="text-white">{successData.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Daily Return Rate:</span> <span className="text-emerald-400 font-bold">+{successData.dailyReturnPercent || (successData.apy ? Number((successData.apy / 365).toFixed(2)) : 1.5)}% / Day</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Equivalent APY:</span> <span className="text-emerald-400">{successData.apy}% APY</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Redemption Terms:</span> <span className="text-emerald-400">100% Flexible · Unstake Anytime</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Automated Notice:</span> <span className="text-slate-200">Email Dispatched</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStakeSubmit} className="space-y-4 pt-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Asset Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                1. Select Crypto Asset
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {supportedAssets.map((asset) => {
                  const meta = TOKEN_METAS[asset];
                  const isSelected = selectedAsset === asset;
                  return (
                    <button
                      key={asset}
                      type="button"
                      onClick={() => setSelectedAsset(asset)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shrink-0 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: meta?.color || '#cbd5e1' }}
                      />
                      <span className="font-bold">{asset}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Staking Plan Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                2. Select Flexible Staking Plan (Daily Return Tier)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  const pDaily = p.dailyReturnPercent || (p.apy ? Number((p.apy / 365).toFixed(2)) : 1.5);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-white truncate">{p.name}</span>
                        <span className="font-mono text-emerald-400 font-bold">+{pDaily}% / Day</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span className="text-slate-400">{p.apy}% APY</span>
                        <span className="font-mono">Min ${p.minStakeUsd}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="text-[11px] font-medium text-slate-400">
                  3. Enter Stake Amount
                </label>
                <div className="text-[11px] text-slate-400">
                  Available:{' '}
                  <span className="font-mono font-semibold text-slate-200">
                    {availableBalance.toFixed(4)} {selectedAsset}
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">
                  {selectedAsset}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentage(pct)}
                    className="flex-1 py-1 text-[10px] font-mono font-medium rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Yield Projection Card */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Staked Value (USD):</span>
                <span>${amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Daily Return Rate:</span>
                <span className="text-emerald-400 font-semibold">+{dailyRatePercent}% / day</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                <span>Estimated Daily Payout:</span>
                <span>+{dailyYieldAsset.toFixed(4)} {selectedAsset} (~${dailyYieldUsd.toFixed(2)}/day)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>30-Day Estimated Return:</span>
                <span className="text-white font-medium">+{monthlyYieldAsset.toFixed(4)} {selectedAsset} (~${monthlyYieldUsd.toFixed(2)})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Annual Compounded Return:</span>
                <span className="text-amber-400">+{annualYieldAsset.toFixed(4)} {selectedAsset} (~${annualYieldUsd.toFixed(2)})</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming Stake...' : 'Lock & Start Earning'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
