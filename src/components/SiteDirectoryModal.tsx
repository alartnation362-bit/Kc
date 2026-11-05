import React, { useState } from 'react';
import {
  X,
  Search,
  Layers,
  TrendingUp,
  Wallet,
  Users,
  FileSpreadsheet,
  Shield,
  Headphones,
  Mail,
  MapPin,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Coins,
  CheckCircle2,
  Activity,
  Globe
} from 'lucide-react';
import { SupportedAssetId, SystemSettings } from '../types/crypto';

interface SiteDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'landing' | 'staking' | 'admin' | 'notifications') => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenStake: (planId?: string) => void;
  onOpenReferral: () => void;
  onOpenSupport: () => void;
  onOpenAuth: () => void;
  settings?: SystemSettings;
  userLoggedIn: boolean;
}

export const SiteDirectoryModal: React.FC<SiteDirectoryModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenStake,
  onOpenReferral,
  onOpenSupport,
  onOpenAuth,
  settings,
  userLoggedIn
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const hqAddress =
    settings?.headquartersAddress ||
    'One World Trade Center, 285 Fulton Street, Suite 7800, New York, NY 10007, United States';

  const directorySections = [
    {
      id: 'staking',
      category: 'Staking & Daily Returns',
      icon: <Layers className="w-5 h-5 text-amber-500" />,
      color: 'border-amber-500/20 bg-amber-500/5',
      items: [
        {
          title: 'All Staking Pools (1.0% - 4.2% / Day)',
          desc: 'Flexible lockups from 7 to 365 days with continuous daily returns and unstake anytime.',
          badge: 'Daily Yield',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          action: () => {
            onNavigate('staking');
            onClose();
          },
          buttonLabel: 'View Pools'
        },
        {
          title: 'Daily Returns Calculator',
          desc: 'Simulate daily, monthly, and yearly yields across BTC, ETH, SOL, USDT, USDC, BNB, and AVAX.',
          badge: 'Simulator',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          action: () => {
            onNavigate('landing');
            onClose();
          },
          buttonLabel: 'Open Calculator'
        },
        {
          title: 'Active Stakes & Continuous Accrual',
          desc: 'Real-time second-by-second reward ticker with one-click claim to your liquid wallet balance.',
          badge: 'Live Claims',
          badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          action: () => {
            if (userLoggedIn) {
              onNavigate('staking');
            } else {
              onOpenAuth();
            }
            onClose();
          },
          buttonLabel: userLoggedIn ? 'My Staking' : 'Sign In'
        }
      ]
    },
    {
      id: 'treasury',
      category: 'Multi-Chain Asset Treasury',
      icon: <Wallet className="w-5 h-5 text-emerald-500" />,
      color: 'border-emerald-500/20 bg-emerald-500/5',
      items: [
        {
          title: 'Deposit Crypto Liquidity',
          desc: 'Instant QR and address generator for Bitcoin, Ethereum, Solana, USDT, USDC, BNB, and AVAX.',
          badge: '7 Chains',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          action: () => {
            onOpenDeposit();
            onClose();
          },
          buttonLabel: 'Deposit Now'
        },
        {
          title: 'Instant Capital Withdrawal',
          desc: 'Withdraw principle or accumulated yields with 2FA protection and multi-sig verification.',
          badge: 'Flexible',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          action: () => {
            onOpenWithdraw();
            onClose();
          },
          buttonLabel: 'Withdraw'
        }
      ]
    },
    {
      id: 'market',
      category: 'Live Binance US Market Feed',
      icon: <Activity className="w-5 h-5 text-amber-500" />,
      color: 'border-amber-500/20 bg-amber-500/5',
      items: [
        {
          title: 'Binance Live Asset Spot Prices',
          desc: 'Real-time 24hr high, low, volume, and percentage changes fed directly from Binance US API.',
          badge: 'Binance API',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          action: () => {
            onNavigate('landing');
            onClose();
          },
          buttonLabel: 'View Live Feed'
        }
      ]
    },
    {
      id: 'referrals',
      category: 'Affiliate & Referral Program',
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      color: 'border-indigo-500/20 bg-indigo-500/5',
      items: [
        {
          title: 'Referral Dashboard & Partner Tiers',
          desc: 'Earn 8% to 12% lifetime commission on every deposit and stake completed by your invitees.',
          badge: 'Up to 12%',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          action: () => {
            onOpenReferral();
            onClose();
          },
          buttonLabel: 'Open Referral'
        }
      ]
    },
    {
      id: 'history',
      category: 'Financial Ledger & Tax Reporting',
      icon: <FileSpreadsheet className="w-5 h-5 text-sky-500" />,
      color: 'border-sky-500/20 bg-sky-500/5',
      items: [
        {
          title: 'Transaction Ledger & Reward Payouts',
          desc: 'Full audit logs for deposits, withdrawals, and daily rewards with TXID tracking and filtering.',
          badge: 'Immutable',
          badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          action: () => {
            if (userLoggedIn) {
              onNavigate('staking');
            } else {
              onOpenAuth();
            }
            onClose();
          },
          buttonLabel: 'Open Ledger'
        },
        {
          title: 'Automated Email Notification Audits',
          desc: 'Cryptographic email receipts dispatched for every deposit, staking reward, and account event.',
          badge: 'Email Audit',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          action: () => {
            onNavigate('notifications');
            onClose();
          },
          buttonLabel: 'View Emails'
        }
      ]
    },
    {
      id: 'security_hq',
      category: 'Corporate Headquarters & Jurisdiction',
      icon: <MapPin className="w-5 h-5 text-rose-500" />,
      color: 'border-rose-500/20 bg-rose-500/5',
      items: [
        {
          title: 'Physical Headquarters (New York, United States)',
          desc: hqAddress,
          badge: 'USA Entity',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          action: () => {
            onNavigate('landing');
            onClose();
          },
          buttonLabel: 'View Details'
        },
        {
          title: 'Regulatory & FinCEN Compliance',
          desc: 'FinCEN Registered Money Services Business (MSB #31000284729184) under US Federal Law.',
          badge: 'FinCEN MSB',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          action: () => {
            onNavigate('landing');
            onClose();
          },
          buttonLabel: 'Compliance Info'
        }
      ]
    },
    {
      id: 'support',
      category: '24/7 VIP Concierge Support',
      icon: <Headphones className="w-5 h-5 text-emerald-500" />,
      color: 'border-emerald-500/20 bg-emerald-500/5',
      items: [
        {
          title: 'WhatsApp VIP Support Desk',
          desc: 'Instant direct chat with senior blockchain settlement engineers and deposit verifiers.',
          badge: '24/7 Live',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          action: () => {
            onOpenSupport();
            onClose();
          },
          buttonLabel: 'Chat WhatsApp'
        },
        {
          title: 'Telegram Official Support Channel',
          desc: 'Real-time incident response and VIP institutional investor dispatch channel.',
          badge: 'Telegram',
          badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          action: () => {
            onOpenSupport();
            onClose();
          },
          buttonLabel: 'Open Telegram'
        }
      ]
    },
    {
      id: 'governance',
      category: 'Platform Administration & Controls',
      icon: <Shield className="w-5 h-5 text-purple-500" />,
      color: 'border-purple-500/20 bg-purple-500/5',
      items: [
        {
          title: 'Institutional Admin Console',
          desc: 'Configure staking plans, adjust daily return rates, manage deposit addresses, and update protocol settings.',
          badge: 'Admin Only',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          action: () => {
            onNavigate('admin');
            onClose();
          },
          buttonLabel: 'Admin Panel'
        }
      ]
    }
  ];

  // Filter sections by search query
  const filteredSections = directorySections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.desc.toLowerCase().includes(search.toLowerCase()) ||
          section.category.toLowerCase().includes(search.toLowerCase())
      )
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Platform Directory & All Options
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-800">
                  Site Map
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Browse every capability, staking pool, treasury tool, market feed, and regulatory credential available on VaultStake.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close directory"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Physical Address Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="text-base">🇺🇸</span>
            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white">Corporate Headquarters:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">{hqAddress}</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            FinCEN MSB Registered
          </span>
        </div>

        {/* Search Input Filter */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search all options (e.g. Binance price, referral, deposit, staking, New York address, tax export)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Directory Content List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {filteredSections.map((section) => (
            <div key={section.id} className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                {section.icon}
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
                  {section.category}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-amber-400/50 dark:hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </h4>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap font-semibold ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                        {item.desc}
                      </p>
                    </div>

                    <button
                      onClick={item.action}
                      className="self-end px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>{item.buttonLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No matching options found for "{search}"
              </p>
              <button
                onClick={() => setSearch('')}
                className="text-xs text-amber-500 underline font-medium"
              >
                Clear search filter
              </button>
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">VaultStake Institutional Vault:</span>
            <span>All 7 blockchains active · Continuous 24/7 settlement</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-xs transition-colors cursor-pointer"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
