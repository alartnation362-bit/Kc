export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  walletBalances: Record<string, number>; // assetId -> available amount
  is2FAEnabled?: boolean;
}

export type SupportedAssetId = 'BTC' | 'ETH' | 'SOL' | 'USDT' | 'USDC' | 'BNB' | 'AVAX';

export interface CryptoAsset {
  id: SupportedAssetId;
  name: string;
  symbol: string;
  network: string;
  iconBg: string;
  priceUsd: number;
  change24h: number;
  decimals: number;
  minDeposit: number;
  minWithdrawal: number;
  withdrawalFee: number;
}

export interface DepositAddressConfig {
  assetId: SupportedAssetId;
  chainName: string;
  networkType: string;
  address: string;
  confirmationsRequired: number;
  memoOrTag?: string;
  notes: string;
}

export interface StakingPlan {
  id: string;
  name: string;
  tagline: string;
  lockPeriodDays: number; // 0 for flexible
  dailyReturnPercent: number; // e.g. 1.5% daily return
  apy: number; // e.g. 547.5% APY (or dailyReturnPercent * 365)
  minStakeUsd: number;
  maxStakeUsd: number;
  features: string[];
  isPopular?: boolean;
}

export interface StakePosition {
  id: string;
  userId: string;
  assetId: SupportedAssetId;
  planId: string;
  planName: string;
  amount: number;
  amountUsd: number;
  dailyReturnPercent: number; // e.g. 1.5% daily return
  apy: number;
  lockPeriodDays: number;
  startDate: string;
  endDate: string;
  lastClaimDate: string;
  accruedRewards: number; // In asset units
  status: 'active' | 'completed' | 'unstaked';
}

export type TransactionType = 'deposit' | 'withdrawal' | 'stake' | 'unstake' | 'reward_claim';
export type TransactionStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: TransactionType;
  assetId: SupportedAssetId;
  amount: number;
  amountUsd: number;
  network: string;
  toAddress?: string;
  txHash?: string;
  status: TransactionStatus;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  adminNote?: string;
}

export interface EmailNotification {
  id: string;
  userId: string;
  toEmail: string;
  subject: string;
  eventType: 'deposit_received' | 'deposit_approved' | 'deposit_rejected' | 'withdrawal_requested' | 'withdrawal_completed' | 'withdrawal_rejected' | 'stake_created' | 'reward_claimed' | 'security_alert';
  previewText: string;
  htmlContent: string;
  sentAt: string;
  status: 'sent' | 'delivered';
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: 'deposit' | 'withdrawal' | 'staking' | 'security' | 'other';
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

export interface SystemSettings {
  whatsappNumber: string;
  whatsappUrl: string;
  telegramHandle: string;
  telegramUrl: string;
  supportGreeting: string;
  totalAumOverride?: number;
  allowNewRegistrations: boolean;
  maintenanceMode: boolean;
  headquartersAddress?: string;
  entityLegalName?: string;
}

export interface ReferralUser {
  id: string;
  emailMasked: string;
  registeredAt: string;
  volumeStakedUsd: number;
  commissionEarnedUsd: number;
  status: 'active_staker' | 'registered';
}

export interface ReferralTier {
  tier: number;
  name: string;
  ratePercent: number;
  minStakers: number;
  active: boolean;
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferredUsers: number;
  activeStakersCount: number;
  totalVolumeStakedUsd: number;
  totalCommissionsEarnedUsd: number;
  claimableCommissionUsd: number;
  commissionRatePercent: number;
  referralTiers: ReferralTier[];
  referredUsers: ReferralUser[];
}

export interface BinanceMarketFeed {
  symbol: string;
  assetId: SupportedAssetId;
  priceUsd: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  lastUpdated: string;
  source: string;
}

export interface DashboardMetrics {
  totalBalanceUsd: number;
  totalStakedUsd: number;
  totalEarnedUsd: number;
  activeStakesCount: number;
  pendingTransactionsCount: number;
}

export interface PlatformStats {
  totalPlatformStakedUsd: number;
  totalPlatformPayoutUsd: number;
  activeStakersCount: number;
  totalTransactionsCount: number;
  supportedChainsCount: number;
}

export interface AdminMetrics {
  totalAumUsd: number;
  totalTvlUsd: number;
  totalPlatformStakedUsd?: number;
  totalPaidRewardsUsd: number;
  totalUsersCount: number;
  activeStakersCount: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  assetDistribution: {
    assetId: SupportedAssetId;
    amount: number;
    amountUsd: number;
    percentage: number;
  }[];
}

