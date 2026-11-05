import React from 'react';
import {
  TrendingUp,
  Layers,
  Shield,
  Mail,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  LayoutGrid,
  Headphones,
  MapPin,
  X,
  ChevronRight,
  ExternalLink,
  Activity,
  CheckCircle2,
  User as UserIcon,
  LogOut,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { PlatformStats, SystemSettings } from '../types/crypto';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'landing' | 'staking' | 'admin' | 'notifications';
  onNavigate: (view: 'landing' | 'staking' | 'admin' | 'notifications') => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenReferral: () => void;
  onOpenDirectory: () => void;
  onOpenSupport: () => void;
  onOpenAuth: () => void;
  unreadCount?: number;
  platformStats?: PlatformStats;
  assetPrices?: Record<string, { priceUsd: number; change24h: number; name: string; symbol: string }>;
  settings?: SystemSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenReferral,
  onOpenDirectory,
  onOpenSupport,
  onOpenAuth,
  unreadCount = 0,
  platformStats,
  assetPrices,
  settings
}) => {
  const { user, role, switchRole, logout } = useAuth();
  const { t } = useLanguage();

  // Escape key handler & body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const hqAddress =
    settings?.headquartersAddress ||
    'One World Trade Center, 285 Fulton Street, Suite 7800, New York, NY 10007, United States';

  const navItems = [
    {
      id: 'landing',
      label: t('nav.overview', 'Overview & Markets'),
      view: 'landing' as const,
      icon: <TrendingUp className="w-4 h-4" />,
      badge: null
    },
    {
      id: 'staking',
      label: t('nav.stakingPools', 'Staking Pools'),
      view: 'staking' as const,
      icon: <Layers className="w-4 h-4" />,
      badge: '1.0% - 4.2%/d'
    },
    {
      id: 'notifications',
      label: t('nav.emailAudit', 'Email Audit Receipts'),
      view: 'notifications' as const,
      icon: <Mail className="w-4 h-4" />,
      badge: unreadCount > 0 ? `${unreadCount} new` : null,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
    },
    {
      id: 'admin',
      label: t('nav.adminConsole', 'Admin Console'),
      view: 'admin' as const,
      icon: <Shield className="w-4 h-4" />,
      badge: 'Elena'
    }
  ];

  // Quick live prices ticker for BTC, ETH, SOL from Binance
  const tickerAssets = ['BTC', 'ETH', 'SOL'] as const;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Drawer on mobile, toggleable side rail on desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onNavigate('landing');
              onClose();
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
              V
            </div>
            <div>
              <div className="text-base font-black text-slate-900 dark:text-white leading-tight">
                VaultStake
              </div>
              <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                Daily Returns Vault
              </div>
            </div>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close sidebar"
            title="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Section 1: Main Platform Navigation */}
          <div className="space-y-1">
            <div className="px-2.5 pb-2 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              Protocol Navigation
            </div>
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.view);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-400/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section 2: Financial Treasury Actions */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              Treasury & Settlement
            </div>

            <button
              onClick={() => {
                onOpenDeposit();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </div>
                <span>Deposit Crypto (7 Chains)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Instant
              </span>
            </button>

            <button
              onClick={() => {
                onOpenWithdraw();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <span>Withdraw Capital</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">2FA Verified</span>
            </button>

            <button
              onClick={() => {
                onOpenReferral();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <span>Referral Program</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                8% - 12%
              </span>
            </button>

            <button
              onClick={() => {
                onOpenDirectory();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <LayoutGrid className="w-3.5 h-3.5" />
                </div>
                <span>Explore All Options</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Directory</span>
            </button>
          </div>

          {/* Section 3: Binance US Live Market Feeds */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Binance US Live Feed</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Online
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {tickerAssets.map((asset) => {
                const info = assetPrices?.[asset] || { priceUsd: 1, change24h: 0 };
                return (
                  <div key={asset} className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{asset}/USDT</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 dark:text-white font-bold tabular-nums">
                        ${info.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          info.change24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {info.change24h >= 0 ? '+' : ''}{info.change24h}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: 24/7 VIP Concierge Support */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="px-2.5 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              Live Operations Desk
            </div>

            <button
              onClick={() => {
                onOpenSupport();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>24/7 VIP Support Desk</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>

          {/* Section 5: Official Corporate Headquarters Card */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-[11px]">
              <span className="text-sm">🇺🇸</span>
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>New York Headquarters</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
              {hqAddress}
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              <span>FinCEN MSB Registered</span>
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Sidebar Footer: User Profile & Role Switcher */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Role Switcher Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-300/50 dark:border-slate-800 text-[11px] font-mono">
                <button
                  onClick={() => {
                    switchRole('user');
                    onNavigate('staking');
                    onClose();
                  }}
                  className={`flex-1 py-1 px-2 rounded font-semibold text-center transition-all cursor-pointer ${
                    role === 'user'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Investor
                </button>
                <button
                  onClick={() => {
                    switchRole('admin');
                    onNavigate('admin');
                    onClose();
                  }}
                  className={`flex-1 py-1 px-2 rounded font-semibold text-center transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                onClose();
              }}
              className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span>{t('nav.signIn', 'Sign In or Register')}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
