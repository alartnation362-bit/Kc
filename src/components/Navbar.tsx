import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Bell,
  CheckCircle2,
  Sun,
  Moon,
  Globe,
  TrendingUp,
  Activity,
  LayoutGrid,
  Gift,
  Menu
} from 'lucide-react';
import { PlatformStats } from '../types/crypto';

interface NavbarProps {
  currentView: 'landing' | 'staking' | 'admin' | 'notifications';
  onNavigate: (view: 'landing' | 'staking' | 'admin' | 'notifications') => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenAuth: () => void;
  onOpenDirectory: () => void;
  onOpenReferral: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
  unreadCount?: number;
  platformStats?: PlatformStats;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenAuth,
  onOpenDirectory,
  onOpenReferral,
  onToggleSidebar,
  isSidebarOpen,
  unreadCount = 0,
  platformStats
}) => {
  const { user, role, switchRole, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currentLanguage, setLanguage, availableLanguages, currentLanguageOption, t } = useLanguage();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalStakedDisplay = platformStats
    ? `$${(platformStats.totalPlatformStakedUsd / 1_000_000).toFixed(2)}M`
    : '$48.62M';

  const totalPayoutDisplay = platformStats
    ? `$${(platformStats.totalPlatformPayoutUsd / 1_000_000).toFixed(2)}M`
    : '$14.40M';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
        {/* Left: Sidebar Toggle + Brand + Protocol Stats Ticker */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar Navigation Menu"
            title="Toggle Sidebar Navigation Menu"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300" />
          </button>

          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm">
              V
            </div>
            <span>VaultStake</span>
          </button>

          {/* Platform Live Stats Pill: Total Staked & Total Paid Out */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">{t('nav.totalStakedTicker', 'Total Staked')}:</span>
              <span className="font-bold text-slate-900 dark:text-amber-400">{totalStakedDisplay}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">{t('nav.totalPayoutTicker', 'Paid Out')}:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalPayoutDisplay}</span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-slate-100 ${
              currentView === 'landing' ? 'text-amber-500 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            {t('nav.overview', 'Overview')}
          </button>

          <button
            onClick={() => onNavigate('staking')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-slate-100 ${
              currentView === 'staking' ? 'text-amber-500 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            {t('nav.stakingPools', 'Staking Pools')}
          </button>

          <button
            onClick={() => onNavigate('notifications')}
            className={`relative transition-colors whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-slate-100 flex items-center gap-1.5 ${
              currentView === 'notifications' ? 'text-amber-500 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            <span>{t('nav.emailAudit', 'Email Audit')}</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('admin')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-slate-100 flex items-center gap-1.5 ${
              currentView === 'admin' ? 'text-amber-500 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('nav.adminConsole', 'Admin Console')}</span>
          </button>

          <button
            onClick={onOpenReferral}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-slate-100 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer"
            title="Earn up to 12% in instant referral rewards"
          >
            <Gift className="w-3.5 h-3.5 text-indigo-500" />
            <span>Referral</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              8%
            </span>
          </button>

          <button
            onClick={onOpenDirectory}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-colors font-semibold whitespace-nowrap shrink-0 cursor-pointer text-xs"
            title="Explore all features, staking plans, tools, Binance live feed & options"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
            <span>All Options</span>
          </button>
        </nav>

        {/* Right: Controls (Theme Toggle, Language Selector, Directory, Auth/Deposit) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile All Options Button */}
          <button
            onClick={onOpenDirectory}
            aria-label="Explore All Options"
            className="md:hidden flex items-center gap-1 p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold cursor-pointer"
            title="Browse all options"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[11px] font-bold">Options</span>
          </button>
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t('nav.theme', 'Toggle Theme')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Multi-Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Select Language"
            >
              <span className="text-sm">{currentLanguageOption.flag}</span>
              <span className="hidden sm:inline font-mono uppercase text-[11px] font-semibold">{currentLanguageOption.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  <span>{t('nav.language', 'Language')}</span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                        currentLanguage === lang.code
                          ? 'text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/20'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      {currentLanguage === lang.code && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Account / Sign In */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {user.name.charAt(0)}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">{user.name}</span>
                <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>

                  {/* Switch Account Quick Toggles */}
                  <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="px-3 text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                      {t('nav.roleSwitcher', 'Account Role Switcher')}
                    </p>
                    <button
                      onClick={() => {
                        switchRole('user');
                        setShowUserMenu(false);
                        onNavigate('staking');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        role === 'user' ? 'text-amber-600 dark:text-amber-400 bg-slate-100 dark:bg-slate-800/50' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{t('nav.investor', 'Investor Staker')} (Alex)</span>
                      {role === 'user' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        switchRole('admin');
                        setShowUserMenu(false);
                        onNavigate('admin');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        role === 'admin' ? 'text-amber-600 dark:text-amber-400 bg-slate-100 dark:bg-slate-800/50' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{t('nav.admin', 'Chief Administrator')} (Elena)</span>
                      {role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('nav.signOut', 'Sign Out')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              {t('nav.signIn', 'Sign In')}
            </button>
          )}

          {/* Quick Action Button */}
          {user && (
            <button
              onClick={onOpenDeposit}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              {t('nav.depositCrypto', 'Deposit')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
