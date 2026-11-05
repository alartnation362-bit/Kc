import {
  User,
  CryptoAsset,
  SupportedAssetId,
  StakingPlan,
  StakePosition,
  Transaction,
  EmailNotification,
  DepositAddressConfig,
  SystemSettings,
  AdminMetrics,
  PlatformStats,
  ReferralStats
} from '../types/crypto';

function getAuthHeader(): Record<string, string> {
  const userJson = localStorage.getItem('vaultstake_current_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson) as User;
      return { 'x-user-id': user.id };
    } catch {
      // ignore
    }
  }
  return { 'x-user-id': 'usr_staker_002' };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const text = await res.text();
  let data: any = null;

  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (typeof data === 'string' ? data : null) ||
      `Server request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return (data !== null ? data : {}) as T;
}

export const api = {
  auth: {
    async login(email: string, password: string) {
      return request<{ success: boolean; user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    async register(name: string, email: string, password: string) {
      return request<{ success: boolean; user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
    },
    async switchRole(role: 'user' | 'admin') {
      return request<{ success: boolean; user: User; token: string }>('/api/auth/switch', {
        method: 'POST',
        body: JSON.stringify({ role })
      });
    },
    async sso(provider: 'google' | 'apple', email?: string, name?: string) {
      return request<{ success: boolean; user: User; token: string; provider: string }>('/api/auth/sso', {
        method: 'POST',
        body: JSON.stringify({ provider, email, name })
      });
    },
    async getMe() {
      return request<{ user: User }>('/api/auth/me');
    }
  },

  market: {
    async getPrices() {
      return request<{
        prices: Record<string, { priceUsd: number; change24h: number; name: string; symbol: string; network: string; withdrawalFee: number; high24h?: number; low24h?: number; volume24h?: number; source?: string; lastUpdated?: string }>;
        source?: string;
        status?: string;
        lastSync?: string;
        timestamp: string;
      }>('/api/market/prices');
    },
    async getBinanceLive() {
      return request<{ source: string; status: string; lastSync: string; tickers: Record<string, any> }>('/api/market/binance');
    }
  },

  referrals: {
    async getStats() {
      return request<ReferralStats>('/api/referrals/stats');
    },
    async claimRewards() {
      return request<{ success: boolean; claimedAmountUsd: number; updatedBalances: Record<string, number>; transaction: Transaction }>('/api/referrals/claim', {
        method: 'POST'
      });
    }
  },

  system: {
    async getSettings() {
      return request<{
        settings: SystemSettings;
        depositAddresses: Record<string, DepositAddressConfig>;
        stakingPlans: StakingPlan[];
        platformStats?: PlatformStats;
      }>('/api/system/settings');
    }
  },

  staking: {
    async getMyStakes() {
      return request<{ stakes: (StakePosition & { currentAccruedRewards?: number; currentAccruedUsd?: number })[] }>('/api/staking/my-stakes');
    },
    async createStake(assetId: SupportedAssetId, planId: string, amount: number) {
      return request<{ success: boolean; stake: StakePosition; updatedBalances: Record<string, number> }>('/api/staking/create', {
        method: 'POST',
        body: JSON.stringify({ assetId, planId, amount })
      });
    },
    async claimRewards(stakeId: string) {
      return request<{ success: boolean; claimedAmount: number; updatedBalances: Record<string, number>; stake: StakePosition }>('/api/staking/claim-rewards', {
        method: 'POST',
        body: JSON.stringify({ stakeId })
      });
    },
    async unstake(stakeId: string) {
      return request<{ success: boolean; returnedAmount: number; updatedBalances: Record<string, number>; stake: StakePosition }>('/api/staking/unstake', {
        method: 'POST',
        body: JSON.stringify({ stakeId })
      });
    }
  },

  wallet: {
    async deposit(assetId: SupportedAssetId, amount: number, txHash?: string, network?: string) {
      return request<{ success: boolean; transaction: Transaction }>('/api/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ assetId, amount, txHash, network })
      });
    },
    async withdraw(assetId: SupportedAssetId, amount: number, destinationAddress: string, network?: string) {
      return request<{ success: boolean; transaction: Transaction; updatedBalances: Record<string, number> }>('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ assetId, amount, destinationAddress, network })
      });
    },
    async getTransactions() {
      return request<{ transactions: Transaction[] }>('/api/wallet/transactions');
    },
    getUserExportTaxCsvUrl(userId?: string) {
      return userId ? `/api/wallet/export-tax-csv?userId=${encodeURIComponent(userId)}` : '/api/wallet/export-tax-csv';
    }
  },

  notifications: {
    async getEmails() {
      return request<{ emails: EmailNotification[] }>('/api/notifications/emails');
    }
  },

  support: {
    async submitTicket(data: { subject: string; category?: string; message: string; userEmail?: string }) {
      return request<{ success: boolean; ticket: any; supportLinks: { whatsapp: string; telegram: string } }>('/api/support/ticket', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  admin: {
    async getOverview() {
      return request<{ metrics: AdminMetrics; systemSettings: SystemSettings }>('/api/admin/overview');
    },
    async approveDeposit(transactionId: string, adminNote?: string) {
      return request<{ success: boolean; transaction: Transaction; userNewBalance: number }>('/api/admin/deposits/approve', {
        method: 'POST',
        body: JSON.stringify({ transactionId, adminNote })
      });
    },
    async rejectDeposit(transactionId: string, reason?: string) {
      return request<{ success: boolean; transaction: Transaction }>('/api/admin/deposits/reject', {
        method: 'POST',
        body: JSON.stringify({ transactionId, reason })
      });
    },
    async approveWithdrawal(transactionId: string, payoutTxHash?: string, adminNote?: string) {
      return request<{ success: boolean; transaction: Transaction }>('/api/admin/withdrawals/approve', {
        method: 'POST',
        body: JSON.stringify({ transactionId, payoutTxHash, adminNote })
      });
    },
    async rejectWithdrawal(transactionId: string, reason?: string) {
      return request<{ success: boolean; transaction: Transaction; userNewBalance?: number }>('/api/admin/withdrawals/reject', {
        method: 'POST',
        body: JSON.stringify({ transactionId, reason })
      });
    },
    async updateDepositAddress(data: Partial<DepositAddressConfig> & { assetId: SupportedAssetId; address: string }) {
      return request<{ success: boolean; updatedConfig: DepositAddressConfig; allAddresses: Record<string, DepositAddressConfig> }>('/api/admin/deposit-addresses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async updateSupportSettings(data: Partial<SystemSettings>) {
      return request<{ success: boolean; systemSettings: SystemSettings }>('/api/admin/support-settings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async updateStakingPlan(data: Partial<StakingPlan> & { planId: string }) {
      return request<{ success: boolean; plan: StakingPlan; allPlans: StakingPlan[] }>('/api/admin/staking-plans', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async createStakingPlan(data: Partial<StakingPlan> & { name: string; apy: number }) {
      return request<{ success: boolean; plan: StakingPlan; allPlans: StakingPlan[] }>('/api/admin/staking-plans/create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async deleteStakingPlan(planId: string) {
      return request<{ success: boolean; allPlans: StakingPlan[] }>('/api/admin/staking-plans/delete', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });
    },
    getExportLedgerUrl() {
      return '/api/admin/export-ledger';
    }
  }
};
