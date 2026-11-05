import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SupportWidget } from './components/SupportWidget';
import { EmailNotificationViewer } from './components/EmailNotificationViewer';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { WalletModal } from './views/WalletModal';
import { StakingModal } from './views/StakingModal';
import { AuthModal } from './views/AuthModal';
import { ReferralModal } from './components/ReferralModal';
import { SiteDirectoryModal } from './components/SiteDirectoryModal';
import { Sidebar } from './components/Sidebar';
import {
  SupportedAssetId,
  StakingPlan,
  DepositAddressConfig,
  SystemSettings,
  EmailNotification,
  PlatformStats
} from './types/crypto';
import { api } from './services/api';

function MainApp() {
  const { user, role } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'staking' | 'admin' | 'notifications'>('landing');

  // Modals state
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletMode, setWalletMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [walletAsset, setWalletAsset] = useState<SupportedAssetId>('ETH');

  const [isStakingOpen, setIsStakingOpen] = useState(false);
  const [stakingPlanId, setStakingPlanId] = useState<string | undefined>(undefined);
  const [stakingAsset, setStakingAsset] = useState<SupportedAssetId>('ETH');

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Protocol Data
  const [settings, setSettings] = useState<SystemSettings | undefined>(undefined);
  const [depositAddresses, setDepositAddresses] = useState<Record<string, DepositAddressConfig>>({});
  const [stakingPlans, setStakingPlans] = useState<StakingPlan[]>([]);
  const [assetPrices, setAssetPrices] = useState<Record<string, any>>({});
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | undefined>(undefined);

  const fetchGlobalData = async () => {
    try {
      const [systemRes, priceRes, emailRes] = await Promise.all([
        api.system.getSettings(),
        api.market.getPrices(),
        api.notifications.getEmails()
      ]);
      setSettings(systemRes.settings);
      setDepositAddresses(systemRes.depositAddresses);
      setStakingPlans(systemRes.stakingPlans);
      if (systemRes.platformStats) {
        setPlatformStats(systemRes.platformStats);
      }
      setAssetPrices(priceRes.prices);
      setEmails(emailRes.emails);
    } catch (err) {
      console.error('Failed to load global protocol data:', err);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [user?.id]);

  const handleOpenDeposit = (asset?: SupportedAssetId) => {
    if (!user) {
      setAuthDefaultTab('login');
      setIsAuthOpen(true);
      return;
    }
    if (asset) setWalletAsset(asset);
    setWalletMode('deposit');
    setIsWalletOpen(true);
  };

  const handleOpenWithdraw = (asset?: SupportedAssetId) => {
    if (!user) {
      setAuthDefaultTab('login');
      setIsAuthOpen(true);
      return;
    }
    if (asset) setWalletAsset(asset);
    setWalletMode('withdraw');
    setIsWalletOpen(true);
  };

  const handleOpenStake = (planId?: string, asset?: SupportedAssetId) => {
    if (!user) {
      setAuthDefaultTab('register');
      setIsAuthOpen(true);
      return;
    }
    if (planId) setStakingPlanId(planId);
    if (asset) setStakingAsset(asset);
    setIsStakingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-amber-500/20 selection:text-amber-600 dark:selection:text-amber-200 transition-colors duration-200">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenDeposit={() => handleOpenDeposit()}
        onOpenWithdraw={() => handleOpenWithdraw()}
        onOpenAuth={() => {
          setAuthDefaultTab('login');
          setIsAuthOpen(true);
        }}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onOpenReferral={() => setIsReferralOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        unreadCount={emails.length}
        platformStats={platformStats}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto w-full">
        {currentView === 'landing' && (
          <LandingView
            plans={stakingPlans}
            assetPrices={assetPrices}
            platformStats={platformStats}
            onStartStaking={(planId) => {
              if (user) {
                handleOpenStake(planId);
                setCurrentView('staking');
              } else {
                setAuthDefaultTab('register');
                setIsAuthOpen(true);
              }
            }}
            onOpenDeposit={() => handleOpenDeposit()}
            onOpenSupport={() => setIsSupportOpen(true)}
            onOpenReferral={() => setIsReferralOpen(true)}
          />
        )}

        {currentView === 'staking' && (
          <DashboardView
            plans={stakingPlans}
            depositAddresses={depositAddresses}
            assetPrices={assetPrices}
            platformStats={platformStats}
            onOpenDeposit={handleOpenDeposit}
            onOpenWithdraw={handleOpenWithdraw}
            onOpenStake={handleOpenStake}
            onNavigateToEmails={() => setCurrentView('notifications')}
            onOpenReferral={() => setIsReferralOpen(true)}
          />
        )}

        {currentView === 'notifications' && (
          <EmailNotificationViewer
            emails={emails}
            onRefresh={fetchGlobalData}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboardView
            onSettingsUpdated={fetchGlobalData}
          />
        )}
      </main>

      <Footer
        settings={settings}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* Floating & Expandable Live Support Desk (WhatsApp & Telegram) */}
      <SupportWidget
        settings={settings}
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* Deposit & Withdrawal Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        defaultMode={walletMode}
        initialAsset={walletAsset}
        depositAddresses={depositAddresses}
        assetPrices={assetPrices}
        onSuccessTransaction={fetchGlobalData}
      />

      {/* Staking Action Modal */}
      <StakingModal
        isOpen={isStakingOpen}
        onClose={() => setIsStakingOpen(false)}
        plans={stakingPlans}
        initialPlanId={stakingPlanId}
        initialAsset={stakingAsset}
        assetPrices={assetPrices}
        onStakedSuccess={fetchGlobalData}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        defaultTab={authDefaultTab}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={fetchGlobalData}
      />

      {/* Referral & Affiliate Program Modal */}
      <ReferralModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        onSuccessClaim={fetchGlobalData}
      />

      {/* All Options Platform Directory Mega-Menu Modal */}
      <SiteDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
        onOpenDeposit={() => handleOpenDeposit()}
        onOpenWithdraw={() => handleOpenWithdraw()}
        onOpenStake={(planId) => handleOpenStake(planId)}
        onOpenReferral={() => setIsReferralOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenAuth={() => {
          setAuthDefaultTab('login');
          setIsAuthOpen(true);
        }}
        settings={settings}
        userLoggedIn={!!user}
      />

      {/* Collapsible & Mobile Drawer Sidebar Navigation Menu */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenDeposit={() => handleOpenDeposit()}
        onOpenWithdraw={() => handleOpenWithdraw()}
        onOpenReferral={() => setIsReferralOpen(true)}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenAuth={() => {
          setAuthDefaultTab('login');
          setIsAuthOpen(true);
        }}
        unreadCount={emails.length}
        platformStats={platformStats}
        assetPrices={assetPrices}
        settings={settings}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
