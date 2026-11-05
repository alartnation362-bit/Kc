import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  TrendingUp,
  Coins,
  Settings,
  MessageCircle,
  Send,
  Download,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Users,
  Lock,
  Wallet,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  X,
  CheckCircle2
} from 'lucide-react';
import {
  AdminMetrics,
  SystemSettings,
  DepositAddressConfig,
  StakingPlan,
  Transaction,
  SupportedAssetId
} from '../types/crypto';
import { TOKEN_METAS, IMAGES } from '../constants/assets';
import { api } from '../services/api';

interface AdminDashboardViewProps {
  onSettingsUpdated?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onSettingsUpdated }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'withdrawals' | 'addresses' | 'support' | 'plans'>('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [depositAddresses, setDepositAddresses] = useState<Record<string, DepositAddressConfig>>({});
  const [stakingPlans, setStakingPlans] = useState<StakingPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Edit address state
  const [editingAsset, setEditingAsset] = useState<SupportedAssetId>('ETH');
  const [editAddressInput, setEditAddressInput] = useState('');
  const [editChainInput, setEditChainInput] = useState('');
  const [editConfirmationsInput, setEditConfirmationsInput] = useState(2);
  const [editNotesInput, setEditNotesInput] = useState('');

  // Edit support settings state
  const [whatsappNumberInput, setWhatsappNumberInput] = useState('');
  const [whatsappUrlInput, setWhatsappUrlInput] = useState('');
  const [telegramHandleInput, setTelegramHandleInput] = useState('');
  const [telegramUrlInput, setTelegramUrlInput] = useState('');
  const [supportGreetingInput, setSupportGreetingInput] = useState('');

  // Staking plan editor state
  const [planEditorOpen, setPlanEditorOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState('');
  const [formPlanName, setFormPlanName] = useState('');
  const [formPlanTagline, setFormPlanTagline] = useState('');
  const [formPlanDailyReturn, setFormPlanDailyReturn] = useState<string>('1.5');
  const [formPlanApy, setFormPlanApy] = useState<string>('547.5');
  const [formPlanMinUsd, setFormPlanMinUsd] = useState<string>('100');
  const [formPlanMaxUsd, setFormPlanMaxUsd] = useState<string>('500000');
  const [formPlanLockDays, setFormPlanLockDays] = useState<number>(0);
  const [formPlanIsPopular, setFormPlanIsPopular] = useState(false);
  const [formPlanFeatures, setFormPlanFeatures] = useState('');

  // Processing state
  const [processingTxId, setProcessingTxId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, systemRes, txRes] = await Promise.all([
        api.admin.getOverview(),
        api.system.getSettings(),
        api.wallet.getTransactions()
      ]);

      setMetrics(overviewRes.metrics);
      setSettings(overviewRes.systemSettings);
      setDepositAddresses(systemRes.depositAddresses);
      setStakingPlans(systemRes.stakingPlans);
      setTransactions(txRes.transactions);

      // Pre-fill support settings
      if (overviewRes.systemSettings) {
        setWhatsappNumberInput(overviewRes.systemSettings.whatsappNumber || '');
        setWhatsappUrlInput(overviewRes.systemSettings.whatsappUrl || '');
        setTelegramHandleInput(overviewRes.systemSettings.telegramHandle || '');
        setTelegramUrlInput(overviewRes.systemSettings.telegramUrl || '');
        setSupportGreetingInput(overviewRes.systemSettings.supportGreeting || '');
      }

      // Pre-fill first address
      if (systemRes.depositAddresses['ETH']) {
        const ethConfig = systemRes.depositAddresses['ETH'];
        setEditAddressInput(ethConfig.address);
        setEditChainInput(ethConfig.chainName);
        setEditConfirmationsInput(ethConfig.confirmationsRequired);
        setEditNotesInput(ethConfig.notes);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setActionErrorMsg(err.message || 'Error fetching admin records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Approve Deposit
  const handleApproveDeposit = async (transactionId: string) => {
    setProcessingTxId(transactionId);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      await api.admin.approveDeposit(transactionId, 'Validated on blockchain node cluster');
      setActionSuccessMsg(`Deposit ${transactionId} approved. User wallet balance credited and email receipt sent.`);
      await fetchAdminData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to approve deposit');
    } finally {
      setProcessingTxId(null);
    }
  };

  // 2. Reject Deposit
  const handleRejectDeposit = async (transactionId: string) => {
    const reason = prompt('Please specify rejection reason for the user notification:', 'Invalid blockchain transaction hash / unconfirmed on-chain');
    if (!reason) return;

    setProcessingTxId(transactionId);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      await api.admin.rejectDeposit(transactionId, reason);
      setActionSuccessMsg(`Deposit ${transactionId} rejected. User notified via email.`);
      await fetchAdminData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to reject deposit');
    } finally {
      setProcessingTxId(null);
    }
  };

  // 3. Approve Withdrawal
  const handleApproveWithdrawal = async (transactionId: string) => {
    const customTx = prompt('Enter payout blockchain transaction hash (leave blank to auto-generate institutional hash):');
    setProcessingTxId(transactionId);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      await api.admin.approveWithdrawal(transactionId, customTx || undefined, 'Dispatched from cold multi-sig vault');
      setActionSuccessMsg(`Withdrawal ${transactionId} confirmed & broadcasted. User notified via email.`);
      await fetchAdminData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to approve withdrawal');
    } finally {
      setProcessingTxId(null);
    }
  };

  // 4. Reject Withdrawal
  const handleRejectWithdrawal = async (transactionId: string) => {
    const reason = prompt('Specify rejection reason (funds will be refunded to user wallet):', 'Security policy / address verification required');
    if (!reason) return;

    setProcessingTxId(transactionId);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      await api.admin.rejectWithdrawal(transactionId, reason);
      setActionSuccessMsg(`Withdrawal ${transactionId} rejected. Full balance restored to user wallet.`);
      await fetchAdminData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to reject withdrawal');
    } finally {
      setProcessingTxId(null);
    }
  };

  // 5. Update Deposit Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      await api.admin.updateDepositAddress({
        assetId: editingAsset,
        address: editAddressInput,
        chainName: editChainInput,
        confirmationsRequired: editConfirmationsInput,
        notes: editNotesInput
      });
      setActionSuccessMsg(`Deposit address for ${editingAsset} updated successfully.`);
      await fetchAdminData();
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to update address');
    }
  };

  // 6. Update WhatsApp & Telegram Support
  const handleSaveSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      await api.admin.updateSupportSettings({
        whatsappNumber: whatsappNumberInput,
        whatsappUrl: whatsappUrlInput,
        telegramHandle: telegramHandleInput,
        telegramUrl: telegramUrlInput,
        supportGreeting: supportGreetingInput
      });
      setActionSuccessMsg('WhatsApp & Telegram support channels updated successfully.');
      await fetchAdminData();
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to update support settings');
    }
  };

  // Staking Plan CRUD Handlers
  const handleDailyReturnChange = (val: string) => {
    setFormPlanDailyReturn(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setFormPlanApy((num * 365).toFixed(1));
    }
  };

  const handleApyChange = (val: string) => {
    setFormPlanApy(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setFormPlanDailyReturn((num / 365).toFixed(2));
    }
  };

  const handleOpenEditPlan = (plan: StakingPlan) => {
    setIsEditingExisting(true);
    setEditingPlanId(plan.id);
    setFormPlanName(plan.name);
    setFormPlanTagline(plan.tagline);
    const daily = plan.dailyReturnPercent || (plan.apy ? Number((plan.apy / 365).toFixed(2)) : 1.5);
    setFormPlanDailyReturn(daily.toString());
    setFormPlanApy(plan.apy.toString());
    setFormPlanMinUsd(plan.minStakeUsd.toString());
    setFormPlanMaxUsd(plan.maxStakeUsd.toString());
    setFormPlanLockDays(plan.lockPeriodDays || 0);
    setFormPlanIsPopular(Boolean(plan.isPopular));
    setFormPlanFeatures(plan.features?.join('\n') || '');
    setPlanEditorOpen(true);
  };

  const handleOpenCreatePlan = () => {
    setIsEditingExisting(false);
    setEditingPlanId('');
    setFormPlanName('Flexible Custom Tier');
    setFormPlanTagline('Earn 1.8% daily returns with 100% on-demand instant redemption');
    setFormPlanDailyReturn('1.8');
    setFormPlanApy('657.0');
    setFormPlanMinUsd('150');
    setFormPlanMaxUsd('1000000');
    setFormPlanLockDays(0);
    setFormPlanIsPopular(false);
    setFormPlanFeatures('1.8% daily return credited to balance\n100% flexible unstake anytime with zero penalty\nContinuous block compounding rewards\nInstitutional multi-sig security');
    setPlanEditorOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    const dailyReturnNum = parseFloat(formPlanDailyReturn);
    const apyNum = parseFloat(formPlanApy);
    const minUsdNum = parseFloat(formPlanMinUsd);
    const maxUsdNum = parseFloat(formPlanMaxUsd);

    if (isNaN(dailyReturnNum) || dailyReturnNum <= 0) {
      setActionErrorMsg('Please enter a valid daily return percentage greater than 0.');
      return;
    }

    const featureList = formPlanFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    try {
      if (isEditingExisting) {
        await api.admin.updateStakingPlan({
          planId: editingPlanId,
          name: formPlanName,
          tagline: formPlanTagline,
          dailyReturnPercent: dailyReturnNum,
          apy: apyNum,
          minStakeUsd: isNaN(minUsdNum) ? 50 : minUsdNum,
          maxStakeUsd: isNaN(maxUsdNum) ? 1000000 : maxUsdNum,
          lockPeriodDays: formPlanLockDays,
          isPopular: formPlanIsPopular,
          features: featureList
        });
        setActionSuccessMsg(`Plan "${formPlanName}" updated successfully (+${dailyReturnNum}% / day).`);
      } else {
        await api.admin.createStakingPlan({
          name: formPlanName,
          tagline: formPlanTagline,
          dailyReturnPercent: dailyReturnNum,
          apy: apyNum,
          minStakeUsd: isNaN(minUsdNum) ? 50 : minUsdNum,
          maxStakeUsd: isNaN(maxUsdNum) ? 1000000 : maxUsdNum,
          lockPeriodDays: formPlanLockDays,
          isPopular: formPlanIsPopular,
          features: featureList
        });
        setActionSuccessMsg(`New staking plan "${formPlanName}" created successfully (+${dailyReturnNum}% / day).`);
      }

      setPlanEditorOpen(false);
      await fetchAdminData();
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to save staking plan');
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to permanently delete plan "${planName}"?`)) return;
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      await api.admin.deleteStakingPlan(planId);
      setActionSuccessMsg(`Staking plan "${planName}" deleted.`);
      await fetchAdminData();
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to delete plan');
    }
  };

  // Quick Daily Return update
  const handleUpdatePlanDailyReturn = async (planId: string, currentDaily?: number, currentApy?: number) => {
    const defaultVal = currentDaily || (currentApy ? (currentApy / 365).toFixed(2) : '1.5');
    const newRateStr = prompt('Enter new Daily Return percentage (% per day):', defaultVal.toString());
    if (!newRateStr) return;
    const newRate = parseFloat(newRateStr);
    if (isNaN(newRate) || newRate <= 0) {
      alert('Invalid daily return rate');
      return;
    }

    try {
      await api.admin.updateStakingPlan({
        planId,
        dailyReturnPercent: newRate,
        apy: Number((newRate * 365).toFixed(1))
      });
      setActionSuccessMsg(`Plan daily return rate updated to +${newRate}% / day (${(newRate * 365).toFixed(1)}% APY).`);
      await fetchAdminData();
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to update daily return rate');
    }
  };

  const pendingDeposits = transactions.filter((t) => t.type === 'deposit' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter((t) => t.type === 'withdrawal' && t.status === 'pending');

  const supportedAssets: SupportedAssetId[] = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'AVAX'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Admin Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Institutional Custody Console</h2>
              <span className="text-[10px] font-mono uppercase bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded">
                Admin Clearance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-chain address routing, AUM monitoring, transaction authorizations, and support management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <a
            href={api.admin.getExportLedgerUrl()}
            download="vaultstake-ledger-audit.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Ledger</span>
          </a>

          <button
            onClick={fetchAdminData}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {actionSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-rose-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto scrollbar-thin">
        {[
          { id: 'overview', label: 'AUM & Reporting' },
          { id: 'deposits', label: `Deposit Approvals (${pendingDeposits.length})` },
          { id: 'withdrawals', label: `Withdrawal Approvals (${pendingWithdrawals.length})` },
          { id: 'addresses', label: 'Deposit Addresses Config' },
          { id: 'support', label: 'WhatsApp & Telegram Support' },
          { id: 'plans', label: 'Staking Plans APY' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------- 1. AUM & REPORTING TAB ---------------- */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Total Platform Staked
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-amber-400 font-mono tabular-nums">
                ${(metrics.totalPlatformStakedUsd || (48620450 + metrics.totalTvlUsd)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                Global Cryptographic Vault Liquidity
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Total Platform Rewards Paid Out
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                ${metrics.totalPaidRewardsUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                Cumulative Verified Staker Distributions
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Active Protocol Stakers
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {metrics.activeStakersCount} / {metrics.totalUsersCount} Users
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                {((metrics.activeStakersCount / Math.max(1, metrics.totalUsersCount)) * 100).toFixed(0)}% Staking Engagement
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Pending Queue Clearances
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                {metrics.pendingDepositsCount + metrics.pendingWithdrawalsCount} Action Items
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                {metrics.pendingDepositsCount} Deposits · {metrics.pendingWithdrawalsCount} Withdrawals
              </p>
            </div>
          </div>

          {/* Asset Distribution Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Asset Holdings & Reserve Distribution</h3>
                <p className="text-xs text-slate-400">Total balance aggregated across customer accounts and validator nodes</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-sans">Asset</th>
                    <th className="py-2.5 px-4 text-right">Total Quantity</th>
                    <th className="py-2.5 px-4 text-right">Value (USD)</th>
                    <th className="py-2.5 px-4 text-right">% of Protocol AUM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {metrics.assetDistribution.map((item) => (
                    <tr key={item.assetId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: TOKEN_METAS[item.assetId]?.color || '#fff' }}
                        />
                        <span>{item.assetId}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-white tabular-nums font-bold">
                        {item.amount.toLocaleString()} {item.assetId}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 tabular-nums">
                        ${item.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-400 tabular-nums font-bold">
                        {item.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. DEPOSIT APPROVALS QUEUE TAB ---------------- */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Pending Deposits for Blockchain Audit</h3>
              <p className="text-xs text-slate-400">
                Approving will credit the user wallet balance and trigger an automated receipt email.
              </p>
            </div>
          </div>

          {pendingDeposits.length === 0 ? (
            <div className="p-10 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>All deposit requests are verified and cleared.</span>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Asset & Network</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">USD Value</th>
                      <th className="py-3 px-4">Submitted TXID</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingDeposits.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-sans">
                          <div className="text-white font-medium truncate max-w-[160px]">{tx.userEmail}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{tx.id}</div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-bold text-white">{tx.assetId}</span>
                          <span className="text-[11px] text-slate-400 block font-mono">{tx.network}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 tabular-nums">
                          +{tx.amount} {tx.assetId}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 tabular-nums">
                          ${tx.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          {tx.txHash ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-400 truncate text-[11px]" title={tx.txHash}>
                                {tx.txHash}
                              </span>
                              <button
                                onClick={() => handleCopy(tx.txHash || '', tx.id)}
                                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                title="Copy TXID"
                              >
                                {copiedId === tx.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No TXID provided</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveDeposit(tx.id)}
                              disabled={processingTxId === tx.id}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(tx.id)}
                              disabled={processingTxId === tx.id}
                              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold text-[11px] rounded border border-rose-800 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- 3. WITHDRAWAL APPROVALS QUEUE TAB ---------------- */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Pending Cold-Vault Withdrawals</h3>
              <p className="text-xs text-slate-400">
                Authorizing will broadcast the transaction. Rejecting restores reserved funds back to user balance.
              </p>
            </div>
          </div>

          {pendingWithdrawals.length === 0 ? (
            <div className="p-10 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>No pending withdrawal requests.</span>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Asset</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Destination Address</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingWithdrawals.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-sans">
                          <div className="text-white font-medium truncate max-w-[160px]">{tx.userEmail}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{tx.id}</div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-bold text-white">{tx.assetId}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{tx.network}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-400 tabular-nums">
                          {tx.amount} {tx.assetId}
                        </td>
                        <td className="py-3 px-4 max-w-[220px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 truncate text-[11px]" title={tx.toAddress}>
                              {tx.toAddress}
                            </span>
                            <button
                              onClick={() => handleCopy(tx.toAddress || '', tx.id)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                              title="Copy Destination"
                            >
                              {copiedId === tx.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(tx.id)}
                              disabled={processingTxId === tx.id}
                              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] rounded transition-colors disabled:opacity-50"
                            >
                              Sign & Dispatch
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(tx.id)}
                              disabled={processingTxId === tx.id}
                              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold text-[11px] rounded border border-rose-800 transition-colors disabled:opacity-50"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- 4. DEPOSIT ADDRESSES CONFIG TAB ---------------- */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Asset Selection List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Chain to Reconfigure
            </h3>
            {supportedAssets.map((asset) => {
              const config = depositAddresses[asset];
              const isSelected = editingAsset === asset;
              return (
                <button
                  key={asset}
                  type="button"
                  onClick={() => {
                    setEditingAsset(asset);
                    if (config) {
                      setEditAddressInput(config.address);
                      setEditChainInput(config.chainName);
                      setEditConfirmationsInput(config.confirmationsRequired);
                      setEditNotesInput(config.notes);
                    }
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: TOKEN_METAS[asset]?.color || '#fff' }}
                    />
                    <span className="font-bold text-xs">{asset}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                      {config?.chainName || 'Network'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">Edit</span>
                </button>
              );
            })}
          </div>

          {/* Form to update selected deposit address */}
          <div className="md:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white mb-1">
              Configure Receiving Vault Address: {editingAsset}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Users depositing {editingAsset} will be shown this exact address and auto-generated QR code.
            </p>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Custody Receiving Address ({editingAsset})
                </label>
                <input
                  type="text"
                  required
                  value={editAddressInput}
                  onChange={(e) => setEditAddressInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Chain / Network Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editChainInput}
                    onChange={(e) => setEditChainInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Required Confirmations
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editConfirmationsInput}
                    onChange={(e) => setEditConfirmationsInput(parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Deposit Notice & Instructions for User
                </label>
                <textarea
                  rows={2}
                  value={editNotesInput}
                  onChange={(e) => setEditNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  Save Address Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- 5. WHATSAPP & TELEGRAM SUPPORT TAB ---------------- */}
      {activeTab === 'support' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 max-w-3xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              WhatsApp & Telegram Support Integration
            </h3>
            <p className="text-xs text-slate-400">
              Set official concierge channels. Links will automatically populate the live support widget and footer.
            </p>
          </div>

          <form onSubmit={handleSaveSupport} className="space-y-4">
            {/* WhatsApp Section */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Institutional Channel</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Display Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 849-2910"
                    value={whatsappNumberInput}
                    onChange={(e) => setWhatsappNumberInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Direct Click-to-Chat URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://wa.me/15558492910"
                    value={whatsappUrlInput}
                    onChange={(e) => setWhatsappUrlInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Telegram Section */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Send className="w-4 h-4" />
                <span>Telegram Support Channel</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Telegram Handle / Desk
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@VaultStakeOfficialSupport"
                    value={telegramHandleInput}
                    onChange={(e) => setTelegramHandleInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Telegram Direct Link
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://t.me/VaultStakeOfficialSupport"
                    value={telegramUrlInput}
                    onChange={(e) => setTelegramUrlInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Welcome Greeting */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Support Welcome Banner Text
              </label>
              <textarea
                rows={2}
                value={supportGreetingInput}
                onChange={(e) => setSupportGreetingInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <a
                  href={whatsappUrlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Test WhatsApp Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={telegramUrlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Test Telegram Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                Save Support Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------- 6. STAKING PLANS MANAGER & EDITOR TAB ---------------- */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Staking Plans & Yield Management</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  All Flexible Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                All plans are 100% flexible (unstake anytime with zero penalties). Edit APYs, limits, features, or create custom tiers.
              </p>
            </div>

            <button
              onClick={handleOpenCreatePlan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stakingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                  plan.isPopular
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-900/80 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{plan.name}</span>
                        {plan.isPopular && (
                          <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            Featured
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block mt-1">
                        {plan.lockPeriodDays === 0 ? '100% Flexible · Unstake Anytime' : `${plan.lockPeriodDays} Days Lock`}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-400 font-mono tracking-tight tabular-nums">
                        +{plan.dailyReturnPercent || Number((plan.apy / 365).toFixed(2))}%
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Daily Return</div>
                      <div className="text-[10px] text-slate-500 font-mono">{plan.apy}% APY</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{plan.tagline}</p>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs font-mono space-y-1.5 text-slate-400">
                    <div className="flex justify-between">
                      <span>Redemption:</span>
                      <span className="text-emerald-400 font-bold">
                        {plan.lockPeriodDays === 0 ? '100% Flexible · Unstake Anytime' : `${plan.lockPeriodDays} Days`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Payout / $1k:</span>
                      <span className="text-emerald-400 font-semibold">
                        +${(1000 * ((plan.dailyReturnPercent || Number((plan.apy / 365).toFixed(2))) / 100)).toFixed(2)}/day
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Threshold:</span>
                      <span className="text-slate-200">${plan.minStakeUsd.toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Stake Cap:</span>
                      <span className="text-slate-200">${plan.maxStakeUsd?.toLocaleString() || '1,000,000'} USD</span>
                    </div>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <ul className="text-[11px] text-slate-400 space-y-1 pt-1">
                      {plan.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditPlan(plan)}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdatePlanDailyReturn(plan.id, plan.dailyReturnPercent, plan.apy)}
                    className="py-1.5 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-lg border border-emerald-500/20 transition-colors"
                    title="Quick Daily Return Update"
                  >
                    Daily %
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                    className="py-1.5 px-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 font-semibold text-xs rounded-lg border border-rose-900/50 transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- STAKING PLAN EDITOR MODAL ---------------- */}
      {planEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEditingExisting ? 'Edit Staking Plan' : 'Create New Staking Plan'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure yield parameters, APY rates, and flexible redemption</p>
                </div>
              </div>

              <button
                onClick={() => setPlanEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flexible Prime Pool"
                  value={formPlanName}
                  onChange={(e) => setFormPlanName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Tagline / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instant redemption with zero lockup barriers"
                  value={formPlanTagline}
                  onChange={(e) => setFormPlanTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-emerald-400 mb-1 flex items-center justify-between">
                    <span>Daily Return Rate (% / day)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Core Metric</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      required
                      placeholder="1.5"
                      value={formPlanDailyReturn}
                      onChange={(e) => handleDailyReturnChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/50 rounded-lg text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-emerald-500">%/day</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Equivalent APY (%)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Auto-synced</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="547.5"
                      value={formPlanApy}
                      onChange={(e) => handleApyChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>
              </div>

              {/* Daily Return Projection Helper Strip */}
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Yield on $1,000 Deposit:</span>
                <span className="text-emerald-400 font-bold">
                  +${(1000 * ((parseFloat(formPlanDailyReturn) || 0) / 100)).toFixed(2)}/day (~${(1000 * ((parseFloat(formPlanDailyReturn) || 0) / 100) * 30).toFixed(2)}/mo)
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Lock Duration (Days)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={formPlanLockDays}
                    onChange={(e) => setFormPlanLockDays(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400">
                    {formPlanLockDays === 0 ? 'Flexible' : 'Days'}
                  </span>
                </div>
              </div>

              {/* Flexible Staking Quick Toggle */}
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-300">100% Flexible Staking</div>
                  <div className="text-[11px] text-slate-400">
                    Users can unstake their principal at any time with zero penalties.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormPlanLockDays(0)}
                  className={`px-3 py-1 text-xs font-bold rounded ${
                    formPlanLockDays === 0
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {formPlanLockDays === 0 ? 'Active' : 'Set Flexible'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Min Stake Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formPlanMinUsd}
                    onChange={(e) => setFormPlanMinUsd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Max Stake Cap ($ USD)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formPlanMaxUsd}
                    onChange={(e) => setFormPlanMaxUsd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPlanIsPopular}
                    onChange={(e) => setFormPlanIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-400"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Mark as "Featured / Popular" tier
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Key Features (One feature per line)
                </label>
                <textarea
                  rows={3}
                  value={formPlanFeatures}
                  onChange={(e) => setFormPlanFeatures(e.target.value)}
                  placeholder="100% flexible unstake anytime&#10;Daily compounding rewards&#10;Institutional multi-sig security"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPlanEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-md"
                >
                  {isEditingExisting ? 'Save Plan Updates' : 'Create Staking Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
