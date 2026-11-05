import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  CheckCircle2,
  Copy,
  Check,
  Receipt,
  Sparkles,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { Transaction, StakePosition } from '../types/crypto';
import { TOKEN_METAS } from '../constants/assets';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ExportTaxReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  stakes: StakePosition[];
  assetPrices: Record<string, { priceUsd: number; name: string }>;
}

export const ExportTaxReportModal: React.FC<ExportTaxReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  stakes,
  assetPrices
}) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'all' | '2026' | '2025' | '90d'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'rewards' | 'transfers' | 'staking'>('all');
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Filter transactions based on dateRange
  const now = new Date();
  const filteredTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.createdAt);
    if (dateRange === '2026') {
      if (txDate.getUTCFullYear() !== 2026) return false;
    } else if (dateRange === '2025') {
      if (txDate.getUTCFullYear() !== 2025) return false;
    } else if (dateRange === '90d') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      if (txDate < ninetyDaysAgo) return false;
    }

    if (categoryFilter === 'rewards') {
      return tx.type === 'reward_claim';
    } else if (categoryFilter === 'transfers') {
      return tx.type === 'deposit' || tx.type === 'withdrawal';
    } else if (categoryFilter === 'staking') {
      return tx.type === 'stake' || tx.type === 'unstake' || tx.type === 'reward_claim';
    }
    return true;
  });

  // Filter stakes based on dateRange
  const filteredStakes = stakes.filter((s) => {
    if (categoryFilter === 'transfers') return false;
    const sDate = new Date(s.startDate);
    if (dateRange === '2026' && sDate.getUTCFullYear() !== 2026) return false;
    if (dateRange === '2025' && sDate.getUTCFullYear() !== 2025) return false;
    if (dateRange === '90d') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      if (sDate < ninetyDaysAgo) return false;
    }
    return true;
  });

  // Calculate Tax Summary Metrics
  const totalTaxableRewardsUsd = filteredTxs
    .filter((t) => t.type === 'reward_claim')
    .reduce((acc, t) => acc + (t.amountUsd || 0), 0);

  const totalDepositsUsd = filteredTxs
    .filter((t) => t.type === 'deposit')
    .reduce((acc, t) => acc + (t.amountUsd || 0), 0);

  const totalWithdrawalsUsd = filteredTxs
    .filter((t) => t.type === 'withdrawal')
    .reduce((acc, t) => acc + (t.amountUsd || 0), 0);

  const totalStakedVolumeUsd = filteredTxs
    .filter((t) => t.type === 'stake')
    .reduce((acc, t) => acc + (t.amountUsd || 0), 0);

  const getTaxClassification = (type: string) => {
    switch (type) {
      case 'reward_claim':
        return 'Taxable Ordinary Income (Staking Reward)';
      case 'deposit':
        return 'Transfer In (Non-Taxable Principal Deposit)';
      case 'withdrawal':
        return 'Transfer Out (Capital Withdrawal)';
      case 'stake':
        return 'Internal Capital Lockup (Staking Commitment)';
      case 'unstake':
        return 'Capital Return (Principal Unlocked)';
      default:
        return 'Financial Transfer';
    }
  };

  const generateCsvString = () => {
    const headers = [
      'Record Type',
      'Event Category',
      'Tax Classification',
      'Date & Time (UTC)',
      'Asset Symbol',
      'Asset Name',
      'Amount',
      'Asset Price (USD)',
      'Total Value (USD)',
      'Network / Protocol',
      'Transaction Hash / Contract ID',
      'Address / Destination',
      'Status',
      'Notes / Audit Description'
    ];

    const rows: string[][] = [headers];

    // Transactions
    for (const tx of filteredTxs) {
      const price = assetPrices[tx.assetId]?.priceUsd || 1;
      const assetName = assetPrices[tx.assetId]?.name || tx.assetId;
      rows.push([
        'TRANSACTION',
        tx.type.toUpperCase(),
        `"${getTaxClassification(tx.type)}"`,
        `"${tx.createdAt}"`,
        tx.assetId,
        `"${assetName}"`,
        tx.amount.toString(),
        price.toFixed(2),
        tx.amountUsd.toFixed(2),
        `"${tx.network}"`,
        `"${tx.txHash || tx.id}"`,
        `"${tx.toAddress || ''}"`,
        tx.status.toUpperCase(),
        `"${(tx.notes || tx.adminNote || '').replace(/"/g, '""')}"`
      ]);
    }

    // Staking Positions
    for (const s of filteredStakes) {
      const price = assetPrices[s.assetId]?.priceUsd || 1;
      const assetName = assetPrices[s.assetId]?.name || s.assetId;
      rows.push([
        'STAKING_CONTRACT',
        `STAKE_${s.status.toUpperCase()}`,
        `"Active Yield Agreement (${s.apy}% APY)"`,
        `"${s.startDate}"`,
        s.assetId,
        `"${assetName}"`,
        s.amount.toString(),
        price.toFixed(2),
        s.amountUsd.toFixed(2),
        `"${s.planName} (${s.lockPeriodDays === 0 ? 'Flexible' : s.lockPeriodDays + ' Days'})"`,
        `"${s.id}"`,
        `"Maturity: ${s.endDate}"`,
        s.status.toUpperCase(),
        `"Accrued Yield: ${s.accruedRewards} ${s.assetId} | APY: ${s.apy}%"`
      ]);
    }

    return '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
  };

  const handleDownloadCsv = () => {
    setIsExporting(true);
    try {
      const csvContent = generateCsvString();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `vaultstake-tax-report-${(user?.email || 'user').replace(/[^a-zA-Z0-9]/g, '_')}-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCsv = () => {
    const csvContent = generateCsvString();
    navigator.clipboard.writeText(csvContent);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 my-8 animate-in fade-in duration-200 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Export Tax & Staking CSV Ledger</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
                  IRS & IFRS Compatible
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate an export of your deposits, withdrawals, and staking income formatted for tax accounting and personal record-keeping.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="py-4 border-b border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Range Selector */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Date Range & Tax Year</span>
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                {(
                  [
                    { id: 'all', label: 'Lifetime' },
                    { id: '2026', label: '2026 YTD' },
                    { id: '2025', label: '2025' },
                    { id: '90d', label: '90 Days' }
                  ] as const
                ).map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setDateRange(range.id)}
                    className={`py-1.5 px-2 rounded font-medium text-center transition-colors truncate ${
                      dateRange === range.id
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Category Scope</span>
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                {(
                  [
                    { id: 'all', label: 'All Records' },
                    { id: 'rewards', label: 'Yield Only' },
                    { id: 'transfers', label: 'Transfers' },
                    { id: 'staking', label: 'Staking' }
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`py-1.5 px-2 rounded font-medium text-center transition-colors truncate ${
                      categoryFilter === cat.id
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tax Summary Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Taxable Staking Yield
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono tabular-nums">
              ${totalTaxableRewardsUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono">Ordinary Income</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Total Deposits In
            </div>
            <div className="text-base font-bold text-white font-mono tabular-nums">
              ${totalDepositsUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Non-Taxable Principal</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Total Dispatched Out
            </div>
            <div className="text-base font-bold text-amber-400 font-mono tabular-nums">
              ${totalWithdrawalsUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">External Transfers</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Export Entries
            </div>
            <div className="text-base font-bold text-white font-mono tabular-nums">
              {filteredTxs.length + filteredStakes.length} Rows
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Transactions & Stakes</div>
          </div>
        </div>

        {/* Data Preview Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">CSV Column Preview ({filteredTxs.length + filteredStakes.length} entries)</span>
            <span className="font-mono text-[11px]">Columns: Date · Event · Classification · Asset · Amount · Value (USD) · Status</span>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-950 max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2 px-3 font-sans">Date</th>
                  <th className="py-2 px-3 font-sans">Category</th>
                  <th className="py-2 px-3 font-sans">Classification</th>
                  <th className="py-2 px-3 text-right font-sans">Amount</th>
                  <th className="py-2 px-3 text-right font-sans">USD Value</th>
                  <th className="py-2 px-3 font-sans">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 font-sans font-bold text-white uppercase text-[11px]">
                      {tx.type.replace('_', ' ')}
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[11px] truncate max-w-[180px]">
                      {getTaxClassification(tx.type)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white tabular-nums">
                      {tx.amount} {tx.assetId}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300 tabular-nums">
                      ${tx.amountUsd.toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] uppercase font-semibold text-emerald-400">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredStakes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      {new Date(s.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 font-sans font-bold text-amber-400 uppercase text-[11px]">
                      STAKE {s.status}
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[11px] truncate max-w-[180px]">
                      Yield Contract ({s.apy}% APY)
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white tabular-nums">
                      {s.amount} {s.assetId}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300 tabular-nums">
                      ${s.amountUsd.toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] uppercase font-semibold text-amber-400">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-5 mt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCsv ? 'Copied to Clipboard' : 'Copy CSV Text'}</span>
            </button>

            <a
              href={api.wallet.getUserExportTaxCsvUrl(user?.id)}
              download
              className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
            >
              Direct Server URL
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating CSV...' : 'Download CSV File'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
