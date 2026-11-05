import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Database Directory & File
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Data Structure
interface DatabaseSchema {
  users: Array<{
    id: string;
    email: string;
    password: string; // Plain/hashed comparison
    name: string;
    role: 'user' | 'admin';
    createdAt: string;
    referralCode?: string;
    referredBy?: string;
    referralClaimableUsd?: number;
    walletBalances: Record<string, number>;
  }>;
  depositAddresses: Record<string, {
    assetId: string;
    chainName: string;
    networkType: string;
    address: string;
    confirmationsRequired: number;
    memoOrTag?: string;
    notes: string;
  }>;
  stakingPlans: Array<{
    id: string;
    name: string;
    tagline: string;
    lockPeriodDays: number;
    dailyReturnPercent: number;
    apy: number;
    minStakeUsd: number;
    maxStakeUsd: number;
    features: string[];
    isPopular?: boolean;
  }>;
  stakes: Array<{
    id: string;
    userId: string;
    assetId: string;
    planId: string;
    planName: string;
    amount: number;
    amountUsd: number;
    dailyReturnPercent?: number;
    apy: number;
    lockPeriodDays: number;
    startDate: string;
    endDate: string;
    lastClaimDate: string;
    accruedRewards: number;
    status: 'active' | 'completed' | 'unstaked';
  }>;
  transactions: Array<{
    id: string;
    userId: string;
    userEmail: string;
    type: 'deposit' | 'withdrawal' | 'stake' | 'unstake' | 'reward_claim';
    assetId: string;
    amount: number;
    amountUsd: number;
    network: string;
    toAddress?: string;
    txHash?: string;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    createdAt: string;
    completedAt?: string;
    notes?: string;
    adminNote?: string;
  }>;
  emails: Array<{
    id: string;
    userId: string;
    toEmail: string;
    subject: string;
    eventType: string;
    previewText: string;
    htmlContent: string;
    sentAt: string;
    status: 'sent' | 'delivered';
  }>;
  supportTickets: Array<{
    id: string;
    userId: string;
    userEmail: string;
    subject: string;
    category: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved';
    createdAt: string;
  }>;
  systemSettings: {
    whatsappNumber: string;
    whatsappUrl: string;
    telegramHandle: string;
    telegramUrl: string;
    supportGreeting: string;
    allowNewRegistrations: boolean;
    maintenanceMode: boolean;
    headquartersAddress?: string;
    entityLegalName?: string;
  };
}

// Live Crypto Price Reference (USD) with Real-Time Binance Feed
export interface AssetPriceInfo {
  priceUsd: number;
  change24h: number;
  name: string;
  symbol: string;
  network: string;
  withdrawalFee: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  lastUpdated?: string;
  source?: string;
}

const ASSET_PRICES: Record<string, AssetPriceInfo> = {
  BTC: { priceUsd: 80350.00, change24h: 2.31, name: 'Bitcoin', symbol: 'BTC', network: 'Native SegWit (Bech32)', withdrawalFee: 0.0002, source: 'Binance Live Feed', lastUpdated: new Date().toISOString() },
  ETH: { priceUsd: 2418.00, change24h: 3.80, name: 'Ethereum', symbol: 'ETH', network: 'ERC-20', withdrawalFee: 0.003, source: 'Binance Live Feed', lastUpdated: new Date().toISOString() },
  SOL: { priceUsd: 96.75, change24h: 3.48, name: 'Solana', symbol: 'SOL', network: 'Solana SPL', withdrawalFee: 0.01, source: 'Binance Live Feed', lastUpdated: new Date().toISOString() },
  USDT: { priceUsd: 1.00, change24h: 0.01, name: 'Tether USD', symbol: 'USDT', network: 'TRC-20 / ERC-20', withdrawalFee: 2.0, source: 'Binance US Peg', lastUpdated: new Date().toISOString() },
  USDC: { priceUsd: 1.00, change24h: 0.00, name: 'USD Coin', symbol: 'USDC', network: 'ERC-20 / Solana', withdrawalFee: 2.0, source: 'Binance Live Feed', lastUpdated: new Date().toISOString() },
  BNB: { priceUsd: 716.20, change24h: 1.96, name: 'BNB Chain', symbol: 'BNB', network: 'BEP-20 (BSC)', withdrawalFee: 0.001, source: 'Binance Live Feed', lastUpdated: new Date().toISOString() },
  AVAX: { priceUsd: 8.78, change24h: 0.56, name: 'Avalanche', symbol: 'AVAX', network: 'Avalanche C-Chain', withdrawalFee: 0.05, source: 'Binance Live Feed', lastUpdated: new Date().toISOString() },
};

let lastBinanceSync = new Date().toISOString();
let binanceSyncStatus: 'online' | 'syncing' | 'offline' = 'online';

async function fetchBinanceLivePrices() {
  try {
    const symbolQuery = '["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","AVAXUSDT","USDCUSDT"]';
    const res = await fetch(`https://api.binance.us/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolQuery)}`, {
      headers: { 'User-Agent': 'VaultStake-Crypto-Service/1.0' }
    });
    if (!res.ok) {
      console.warn(`[Binance] Response status: ${res.status}`);
      return;
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      for (const item of data) {
        let assetKey = '';
        if (item.symbol === 'BTCUSDT') assetKey = 'BTC';
        else if (item.symbol === 'ETHUSDT') assetKey = 'ETH';
        else if (item.symbol === 'SOLUSDT') assetKey = 'SOL';
        else if (item.symbol === 'BNBUSDT') assetKey = 'BNB';
        else if (item.symbol === 'AVAXUSDT') assetKey = 'AVAX';
        else if (item.symbol === 'USDCUSDT') assetKey = 'USDC';

        if (assetKey && ASSET_PRICES[assetKey]) {
          const lastPrice = parseFloat(item.lastPrice);
          const change24h = parseFloat(item.priceChangePercent);
          const high24h = parseFloat(item.highPrice);
          const low24h = parseFloat(item.lowPrice);
          const volume24h = parseFloat(item.quoteVolume);

          if (!isNaN(lastPrice) && lastPrice > 0) {
            ASSET_PRICES[assetKey].priceUsd = lastPrice;
            ASSET_PRICES[assetKey].change24h = Number(change24h.toFixed(2));
            ASSET_PRICES[assetKey].high24h = high24h;
            ASSET_PRICES[assetKey].low24h = low24h;
            ASSET_PRICES[assetKey].volume24h = volume24h;
            ASSET_PRICES[assetKey].lastUpdated = new Date().toISOString();
            ASSET_PRICES[assetKey].source = 'Binance Live Orderbook';
          }
        }
      }
      ASSET_PRICES['USDT'].priceUsd = 1.00;
      ASSET_PRICES['USDT'].change24h = 0.01;
      ASSET_PRICES['USDT'].source = 'Binance US Peg';
      ASSET_PRICES['USDT'].lastUpdated = new Date().toISOString();

      binanceSyncStatus = 'online';
      lastBinanceSync = new Date().toISOString();
    }
  } catch (err: any) {
    console.warn('[Binance Live Feed] Polling error:', err.message);
  }
}

// Initial Seed Data
const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin_001',
      email: 'admin@vaultstake.io',
      password: 'AdminVault2026!',
      name: 'Elena Rostova (Chief Security Officer)',
      role: 'admin',
      createdAt: '2026-01-10T08:00:00Z',
      walletBalances: {
        BTC: 0.1,
        ETH: 2.0,
        SOL: 50.0,
        USDT: 5000.0,
        USDC: 5000.0,
        BNB: 10.0,
        AVAX: 100.0
      }
    },
    {
      id: 'usr_staker_002',
      email: 'alex.morgan@crypto.org',
      password: 'Staker2026!',
      name: 'Alex Morgan',
      role: 'user',
      createdAt: '2026-02-01T12:00:00Z',
      walletBalances: {
        BTC: 0.35,
        ETH: 3.2,
        SOL: 45.0,
        USDT: 4200.0,
        USDC: 2800.0,
        BNB: 8.5,
        AVAX: 80.0
      }
    }
  ],
  depositAddresses: {
    BTC: {
      assetId: 'BTC',
      chainName: 'Bitcoin Network',
      networkType: 'Native SegWit (Bech32)',
      address: 'bc1q8s97wf64u249t0e7e72zpxz588xsv2y8c4zlm0',
      confirmationsRequired: 2,
      notes: 'Send only BTC to this SegWit address. Minimum deposit is 0.001 BTC.'
    },
    ETH: {
      assetId: 'ETH',
      chainName: 'Ethereum Mainnet',
      networkType: 'ERC-20',
      address: '0x71C8A3926B97C29b552b86F0d7Eb82136979A27D',
      confirmationsRequired: 12,
      notes: 'Send only ETH or standard ERC-20 assets to this address. Minimum deposit is 0.01 ETH.'
    },
    SOL: {
      assetId: 'SOL',
      chainName: 'Solana Mainnet',
      networkType: 'Solana SPL',
      address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      confirmationsRequired: 32,
      notes: 'Send only SOL to this address. Fast confirmation within 30 seconds.'
    },
    USDT: {
      assetId: 'USDT',
      chainName: 'Tether Multi-Network',
      networkType: 'TRC-20 / ERC-20',
      address: '0x71C8A3926B97C29b552b86F0d7Eb82136979A27D',
      confirmationsRequired: 12,
      notes: 'Supports USDT on ERC-20 and BSC networks. Minimum deposit is 50 USDT.'
    },
    USDC: {
      assetId: 'USDC',
      chainName: 'USD Coin Network',
      networkType: 'ERC-20',
      address: '0x71C8A3926B97C29b552b86F0d7Eb82136979A27D',
      confirmationsRequired: 12,
      notes: 'Institutional Circle USDC deposit vault.'
    },
    BNB: {
      assetId: 'BNB',
      chainName: 'BNB Smart Chain',
      networkType: 'BEP-20',
      address: '0x71C8A3926B97C29b552b86F0d7Eb82136979A27D',
      confirmationsRequired: 15,
      notes: 'Send only BNB (BEP-20) to this BSC address.'
    },
    AVAX: {
      assetId: 'AVAX',
      chainName: 'Avalanche C-Chain',
      networkType: 'C-Chain Contract',
      address: '0x71C8A3926B97C29b552b86F0d7Eb82136979A27D',
      confirmationsRequired: 10,
      notes: 'Avalanche C-Chain deposit address.'
    }
  },
  stakingPlans: [
    {
      id: 'plan_flexible',
      name: 'Flexible Starter',
      tagline: 'Earn 1.0% daily returns with continuous block yield - unstake anytime',
      lockPeriodDays: 0,
      dailyReturnPercent: 1.0,
      apy: 365.0,
      minStakeUsd: 50,
      maxStakeUsd: 1000000,
      features: ['1.0% daily return credited to balance', 'Unstake anytime with zero penalty', 'Daily compound rewards', 'Institutional multi-chain protection']
    },
    {
      id: 'plan_30d',
      name: 'Flexible Prime',
      tagline: 'Earn 1.5% daily returns with boosted yield multiplier - withdraw principal anytime',
      lockPeriodDays: 0,
      dailyReturnPercent: 1.5,
      apy: 547.5,
      minStakeUsd: 100,
      maxStakeUsd: 500000,
      features: ['1.5% daily return credited to balance', '100% flexible on-demand redemption', 'Higher daily yield multiplier', 'Auto-claim or reinvest option'],
      isPopular: true
    },
    {
      id: 'plan_90d',
      name: 'Flexible Strategic',
      tagline: 'Earn 2.2% daily returns with priority validator tier - 100% on-demand flexible redemption',
      lockPeriodDays: 0,
      dailyReturnPercent: 2.2,
      apy: 803.0,
      minStakeUsd: 250,
      maxStakeUsd: 1000000,
      features: ['2.2% daily return credited to balance', 'Flexible validator tier', 'Priority payout distribution', 'Institutional insurance backing']
    },
    {
      id: 'plan_180d',
      name: 'Flexible High-Yield',
      tagline: 'Earn 3.0% daily returns with institutional yield compounding - unrestricted instant unstaking',
      lockPeriodDays: 0,
      dailyReturnPercent: 3.0,
      apy: 1095.0,
      minStakeUsd: 500,
      maxStakeUsd: 2500000,
      features: ['3.0% daily return credited to balance', 'Maximized daily performance', 'Fortress cold-storage allocation', 'Zero lockup penalty']
    },
    {
      id: 'plan_365d',
      name: 'Flexible Institutional',
      tagline: 'Earn 4.2% daily returns with premier protocol allocation - full flexible liquidity access',
      lockPeriodDays: 0,
      dailyReturnPercent: 4.2,
      apy: 1533.0,
      minStakeUsd: 1000,
      maxStakeUsd: 10000000,
      features: ['4.2% daily return credited to balance', 'Maximum available protocol yield', 'Instant unstake anytime', 'Custom tax & ledger auditing reports']
    }
  ],
  stakes: [
    {
      id: 'stk_001',
      userId: 'usr_staker_002',
      assetId: 'ETH',
      planId: 'plan_30d',
      planName: 'Prime Flexible',
      amount: 1.5,
      amountUsd: 5220.75,
      dailyReturnPercent: 1.5,
      apy: 547.5,
      lockPeriodDays: 0,
      startDate: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      endDate: new Date(Date.now() + 16 * 24 * 3600 * 1000).toISOString(),
      lastClaimDate: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      accruedRewards: 0.315,
      status: 'active'
    },
    {
      id: 'stk_002',
      userId: 'usr_staker_002',
      assetId: 'SOL',
      planId: 'plan_90d',
      planName: 'Strategic Flexible',
      amount: 20.0,
      amountUsd: 3975.0,
      dailyReturnPercent: 2.2,
      apy: 803.0,
      lockPeriodDays: 0,
      startDate: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
      endDate: new Date(Date.now() + 50 * 24 * 3600 * 1000).toISOString(),
      lastClaimDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      accruedRewards: 4.4,
      status: 'active'
    },
    {
      id: 'stk_003',
      userId: 'usr_staker_002',
      assetId: 'USDT',
      planId: 'plan_flexible',
      planName: 'Flexible Starter',
      amount: 2500.0,
      amountUsd: 2500.0,
      dailyReturnPercent: 1.0,
      apy: 365.0,
      lockPeriodDays: 0,
      startDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      endDate: new Date(Date.now() + 360 * 24 * 3600 * 1000).toISOString(),
      lastClaimDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      accruedRewards: 125.0,
      status: 'active'
    }
  ],
  transactions: [
    {
      id: 'tx_dep_001',
      userId: 'usr_staker_002',
      userEmail: 'alex.morgan@crypto.org',
      type: 'deposit',
      assetId: 'ETH',
      amount: 4.7,
      amountUsd: 16358.35,
      network: 'Ethereum ERC-20',
      txHash: '0x8f3c7e46ab912e75e3a0994fbc266f81c919d363b516a246835a6be47228a8d1',
      status: 'approved',
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000 + 120000).toISOString(),
      notes: 'Initial Ethereum funding deposit',
      adminNote: 'Confirmed on Etherscan block #21984210'
    },
    {
      id: 'tx_dep_002',
      userId: 'usr_staker_002',
      userEmail: 'alex.morgan@crypto.org',
      type: 'deposit',
      assetId: 'SOL',
      amount: 65.0,
      amountUsd: 12918.75,
      network: 'Solana SPL',
      txHash: '5K3dF9xL4g7Hw9N1kE8yZpB6sM3vX2qR7tA8uC4eG1wD6jK9mP2',
      status: 'approved',
      createdAt: new Date(Date.now() - 41 * 24 * 3600 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 41 * 24 * 3600 * 1000 + 45000).toISOString(),
      notes: 'Solana staking pool deposit',
      adminNote: 'Confirmed on Solscan'
    },
    {
      id: 'tx_dep_003',
      userId: 'usr_staker_002',
      userEmail: 'alex.morgan@crypto.org',
      type: 'deposit',
      assetId: 'BTC',
      amount: 0.15,
      amountUsd: 13867.50,
      network: 'Bitcoin Native SegWit',
      txHash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      status: 'pending',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      notes: 'Bitcoin SegWit deposit awaiting blockchain validation'
    },
    {
      id: 'tx_wdr_001',
      userId: 'usr_staker_002',
      userEmail: 'alex.morgan@crypto.org',
      type: 'withdrawal',
      assetId: 'USDT',
      amount: 500.0,
      amountUsd: 500.0,
      network: 'TRC-20',
      toAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      status: 'pending',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      notes: 'User requested withdrawal to external cold storage'
    }
  ],
  emails: [
    {
      id: 'eml_001',
      userId: 'usr_staker_002',
      toEmail: 'alex.morgan@crypto.org',
      subject: 'Deposit Confirmed: 4.7000 ETH Credited to Your Vault',
      eventType: 'deposit_approved',
      previewText: 'Your deposit of 4.7000 ETH has been verified and credited to your VaultStake balance.',
      htmlContent: `<div style="font-family: sans-serif; background: #090d16; color: #f1f5f9; padding: 32px; border-radius: 12px; max-width: 560px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #f59e0b; margin: 0; font-size: 20px;">VAULTSTAKE PROTOCOL</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0;">Automated Transaction Dispatch</p>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">Hello Alex,</p>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">Your deposit request for <strong>4.7000 ETH</strong> (~$16,358.35 USD) has been successfully verified by our institutional node cluster and credited to your available balance.</p>
        <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #9ca3af;">Asset:</span> <span style="font-weight: 600; color: #fff;">Ethereum (ETH)</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #9ca3af;">Network:</span> <span style="color: #fff;">ERC-20 Mainnet</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #9ca3af;">Status:</span> <span style="color: #10b981; font-weight: 600;">Confirmed & Approved</span>
          </div>
          <div style="font-size: 12px; color: #6b7280; word-break: break-all; margin-top: 10px;">
            TXID: 0x8f3c7e46ab912e75e3a0994fbc266f81c919d363b516a246835a6be47228a8d1
          </div>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">You can now allocate these assets into any of our high-yield staking pools to earn up to 26.8% APY.</p>
        <div style="margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b;">
          VaultStake Custody Solutions · Cryptographic Proof Engine · 24/7 Security Hotline
        </div>
      </div>`,
      sentAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      status: 'delivered'
    },
    {
      id: 'eml_002',
      userId: 'usr_staker_002',
      toEmail: 'alex.morgan@crypto.org',
      subject: 'Staking Position Activated: 1.5000 ETH in Prime 30-Day Pool',
      eventType: 'stake_created',
      previewText: 'Your staking position of 1.5000 ETH is now actively compounding yield at 8.5% APY.',
      htmlContent: `<div style="font-family: sans-serif; background: #090d16; color: #f1f5f9; padding: 32px; border-radius: 12px; max-width: 560px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #f59e0b; margin: 0; font-size: 20px;">VAULTSTAKE PROTOCOL</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0;">Staking Contract Confirmation</p>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">Hello Alex,</p>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">You have successfully locked <strong>1.5000 ETH</strong> into the <strong>Prime 30-Day</strong> staking pool at <strong>8.5% APY</strong>.</p>
        <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151; margin: 20px 0;">
          <div style="margin-bottom: 8px; font-size: 13px;"><span style="color: #9ca3af;">Annual Percentage Yield:</span> <strong style="color: #10b981;">8.50% APY</strong></div>
          <div style="margin-bottom: 8px; font-size: 13px;"><span style="color: #9ca3af;">Estimated Period Yield:</span> <strong style="color: #f59e0b;">+0.0104 ETH</strong></div>
          <div style="font-size: 13px;"><span style="color: #9ca3af;">Maturity Date:</span> <span style="color: #fff;">In 16 days</span></div>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">Rewards accrue continuously and can be monitored live from your Staking Dashboard.</p>
      </div>`,
      sentAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      status: 'delivered'
    }
  ],
  supportTickets: [],
  systemSettings: {
    whatsappNumber: '+1 (555) 849-2910',
    whatsappUrl: 'https://wa.me/15558492910?text=Hello%20VaultStake%20Support,%20I%20need%20assistance%20with%20my%20account',
    telegramHandle: '@VaultStakeOfficialSupport',
    telegramUrl: 'https://t.me/VaultStakeOfficialSupport',
    supportGreeting: 'Welcome to VaultStake 24/7 Institutional Support. Our specialists are available on WhatsApp and Telegram with under 5-minute response times.',
    allowNewRegistrations: true,
    maintenanceMode: false,
    headquartersAddress: 'One World Trade Center, 285 Fulton Street, Suite 7800, New York, NY 10007, United States',
    entityLegalName: 'VaultStake Institutional Technologies Inc. (New York, USA)'
  }
};

// Database helper functions
function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: DatabaseSchema = JSON.parse(data);
      let modified = false;

      // Ensure headquarters and entity details are set
      if (!parsed.systemSettings) {
        parsed.systemSettings = { ...INITIAL_DB.systemSettings };
        modified = true;
      }
      if (!parsed.systemSettings.headquartersAddress) {
        parsed.systemSettings.headquartersAddress = 'One World Trade Center, 285 Fulton Street, Suite 7800, New York, NY 10007, United States';
        parsed.systemSettings.entityLegalName = 'VaultStake Institutional Technologies Inc. (New York, USA)';
        modified = true;
      }

      // Ensure all users have a referralCode
      if (parsed.users && Array.isArray(parsed.users)) {
        for (const u of parsed.users) {
          if (!u.referralCode) {
            const cleanName = (u.name || 'USER').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'STKR';
            u.referralCode = `VAULT-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
            modified = true;
          }
        }
      }

      // Ensure all plans are flexible (lockPeriodDays: 0) and operate on daily returns
      if (parsed.stakingPlans && Array.isArray(parsed.stakingPlans)) {
        for (const p of parsed.stakingPlans) {
          if (p.lockPeriodDays !== 0) {
            p.lockPeriodDays = 0;
            modified = true;
          }
          if (p.dailyReturnPercent === undefined || isNaN(p.dailyReturnPercent) || p.dailyReturnPercent <= 0) {
            if (p.id === 'plan_flexible') {
              p.name = 'Flexible Starter';
              p.tagline = 'Earn 1.0% daily returns with continuous block yield - unstake anytime';
              p.dailyReturnPercent = 1.0;
            } else if (p.id === 'plan_30d') {
              p.name = 'Flexible Prime';
              p.tagline = 'Earn 1.5% daily returns with boosted yield multiplier - withdraw principal anytime';
              p.dailyReturnPercent = 1.5;
            } else if (p.id === 'plan_90d') {
              p.name = 'Flexible Strategic';
              p.tagline = 'Earn 2.2% daily returns with priority validator tier - 100% on-demand flexible redemption';
              p.dailyReturnPercent = 2.2;
            } else if (p.id === 'plan_180d') {
              p.name = 'Flexible High-Yield';
              p.tagline = 'Earn 3.0% daily returns with institutional yield compounding - unrestricted instant unstaking';
              p.dailyReturnPercent = 3.0;
            } else if (p.id === 'plan_365d') {
              p.name = 'Flexible Institutional';
              p.tagline = 'Earn 4.2% daily returns with premier protocol allocation - full flexible liquidity access';
              p.dailyReturnPercent = 4.2;
            } else {
              p.dailyReturnPercent = p.apy ? Number((p.apy / 365).toFixed(2)) : 1.5;
            }
            p.apy = Number((p.dailyReturnPercent * 365).toFixed(1));
            modified = true;
          }
          if (!p.features.some((f) => f.includes('daily return'))) {
            p.features.unshift(`${p.dailyReturnPercent}% daily return credited to balance`);
            modified = true;
          }
        }
      }

      // Ensure all active stakes have dailyReturnPercent and flexible terms
      if (parsed.stakes && Array.isArray(parsed.stakes)) {
        for (const s of parsed.stakes) {
          if (s.lockPeriodDays !== 0) {
            s.lockPeriodDays = 0;
            modified = true;
          }
          if (s.dailyReturnPercent === undefined || isNaN(s.dailyReturnPercent) || s.dailyReturnPercent <= 0) {
            s.dailyReturnPercent = s.planId === 'plan_flexible' ? 1.0 : s.planId === 'plan_30d' ? 1.5 : s.planId === 'plan_90d' ? 2.2 : s.planId === 'plan_180d' ? 3.0 : s.planId === 'plan_365d' ? 4.2 : (s.apy ? Number((s.apy / 365).toFixed(2)) : 1.5);
            s.apy = Number((s.dailyReturnPercent * 365).toFixed(1));
            modified = true;
          }
        }
      }

      if (modified) {
        saveDatabase(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error loading database, resetting to initial seed:', err);
  }
  // Initialize with seed
  saveDatabase(INITIAL_DB);
  return INITIAL_DB;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Global in-memory DB reference, loaded from file
let db = loadDatabase();

// Helper to generate automated HTML transaction emails
function createAndSendAutomatedEmail(params: {
  userId: string;
  toEmail: string;
  subject: string;
  eventType: string;
  previewText: string;
  heading: string;
  bodyText: string;
  metadata: Array<{ label: string; value: string; color?: string }>;
}) {
  const metaRows = params.metadata
    .map(
      (m) =>
        `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px;">
          <span style="color: #94a3b8;">${m.label}</span>
          <span style="color: ${m.color || '#f8fafc'}; font-weight: 500;">${m.value}</span>
        </div>`
    )
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #090d16; color: #f8fafc; padding: 32px 20px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
        <div>
          <span style="color: #f59e0b; font-weight: 800; font-size: 18px; letter-spacing: 0.05em;">VAULTSTAKE PROTOCOL</span>
          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Automated Settlement & Security Dispatch</div>
        </div>
        <div style="font-size: 11px; background: #1e293b; color: #38bdf8; padding: 4px 10px; border-radius: 4px; font-weight: 600;">ENCRYPTED ALERT</div>
      </div>
      <h2 style="font-size: 18px; color: #ffffff; margin: 0 0 12px;">${params.heading}</h2>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px;">${params.bodyText}</p>
      
      <div style="background: #0f172a; padding: 18px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600; margin-bottom: 10px;">Transaction Details</div>
        ${metaRows}
      </div>

      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); padding: 14px; border-radius: 6px; font-size: 12px; color: #fcd34d; margin-bottom: 24px;">
        Security Notice: VaultStake administrators will never request your private keys or password over chat or email.
      </div>

      <div style="border-top: 1px solid #1e293b; padding-top: 18px; font-size: 11px; color: #64748b; line-height: 1.5;">
        <div>Recipient: ${params.toEmail} · Timestamp: ${new Date().toUTCString()}</div>
        <div>For inquiries, contact official Telegram: ${db.systemSettings.telegramHandle} or WhatsApp: ${db.systemSettings.whatsappNumber}</div>
      </div>
    </div>
  `;

  const newEmail = {
    id: 'eml_' + Math.random().toString(36).substring(2, 9),
    userId: params.userId,
    toEmail: params.toEmail,
    subject: params.subject,
    eventType: params.eventType,
    previewText: params.previewText,
    htmlContent: html,
    sentAt: new Date().toISOString(),
    status: 'delivered' as const
  };

  db.emails.unshift(newEmail);
  saveDatabase(db);
  return newEmail;
}

// ----------------------------------------------------
// Public APIs & Auth
// ----------------------------------------------------

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    const user = db.users.find(
      (u) => u && u.email && u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    // Return user without password
    const { password: _, ...userSafe } = user;
    return res.json({
      success: true,
      user: userSafe,
      token: 'jwt_mock_' + user.id + '_' + Date.now()
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Internal authentication error' });
  }
});

// Auth: Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Full name, email address, and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanPassword = String(password).trim();

    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@domain.com)' });
    }

    if (cleanPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters in length' });
    }

    const existing = db.users.find(
      (u) => u && u.email && u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      password: cleanPassword,
      name: cleanName,
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      walletBalances: {
        BTC: 0.0,
        ETH: 0.0,
        SOL: 0.0,
        USDT: 0.0,
        USDC: 0.0,
        BNB: 0.0,
        AVAX: 0.0
      }
    };

    db.users.push(newUser);
    saveDatabase(db);

    // Send automated welcome email notification safely
    try {
      createAndSendAutomatedEmail({
        userId: newUser.id,
        toEmail: newUser.email,
        subject: 'Welcome to VaultStake Protocol - Institutional Staking Account Created',
        eventType: 'security_alert',
        previewText: 'Your institutional multi-chain custody and staking vault is initialized.',
        heading: 'Welcome to VaultStake Protocol',
        bodyText: `Your secure institutional staking account has been successfully initialized. You can now deposit cryptocurrency assets, select high-yield staking pools, and monitor continuous rewards.`,
        metadata: [
          { label: 'User Name', value: newUser.name },
          { label: 'Registered Email', value: newUser.email },
          { label: 'Account Tier', value: 'Institutional Standard' },
          { label: 'Custody Mode', value: 'Multi-Signature Cold Storage' }
        ]
      });
    } catch (emailErr) {
      console.error('Welcome email dispatch note:', emailErr);
    }

    const { password: _, ...userSafe } = newUser;
    return res.status(201).json({
      success: true,
      user: userSafe,
      token: 'jwt_mock_' + newUser.id + '_' + Date.now()
    });
  } catch (err: any) {
    console.error('Registration server error:', err);
    return res.status(500).json({ error: err.message || 'Server failed to process account registration' });
  }
});

// Auth: Switch user (convenience for demo/testing)
app.post('/api/auth/switch', (req: Request, res: Response) => {
  try {
    const { role } = req.body || {};
    const targetUser = db.users.find((u) => u && u.role === role);
    if (!targetUser) {
      return res.status(404).json({ error: 'User with requested role not found' });
    }
    const { password: _, ...userSafe } = targetUser;
    return res.json({
      success: true,
      user: userSafe,
      token: 'jwt_mock_' + targetUser.id + '_' + Date.now()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error switching account role' });
  }
});

// Current User Details
app.get('/api/auth/me', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const user = db.users.find((u) => u && u.id === userId) || db.users[1]; // Fallback to demo user
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userSafe } = user;
    return res.json({ user: userSafe });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching user profile' });
  }
});

// Auth: Google and Apple / iCloud Single Sign-On (SSO)
app.post('/api/auth/sso', (req: Request, res: Response) => {
  try {
    const { provider, email, name } = req.body || {};
    if (!provider || (provider !== 'google' && provider !== 'apple')) {
      return res.status(400).json({ error: 'Valid SSO provider (google or apple) is required' });
    }

    const ssoEmail = (email && email.trim()) || (provider === 'google' ? 'alartnation362@gmail.com' : 'investor@icloud.com');
    const ssoName = (name && name.trim()) || (provider === 'google' ? 'Google Staker' : 'Apple iCloud Staker');

    let user = db.users.find((u) => u && u.email.toLowerCase() === ssoEmail.toLowerCase());

    if (!user) {
      // Create new staker account via SSO
      const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
      const cleanName = ssoName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'STKR';
      const referralCode = `VAULT-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;

      user = {
        id: userId,
        email: ssoEmail.toLowerCase(),
        password: 'SSO_' + Math.random().toString(36).substring(2, 15),
        name: ssoName,
        role: 'user',
        createdAt: new Date().toISOString(),
        referralCode,
        walletBalances: {
          BTC: 0.15,
          ETH: 1.5,
          SOL: 25.0,
          USDT: 2500.0,
          USDC: 2000.0,
          BNB: 5.0,
          AVAX: 50.0
        }
      };
      db.users.push(user);
      saveDatabase(db);

      // Automated Welcome Notification
      createAndSendAutomatedEmail({
        userId: user.id,
        toEmail: user.email,
        subject: `Welcome to VaultStake Protocol via ${provider === 'google' ? 'Google' : 'Apple iCloud'}`,
        eventType: 'security_alert',
        previewText: 'Your institutional multi-chain custody vault is ready.',
        heading: `Welcome to VaultStake Protocol (${provider === 'google' ? 'Google SSO' : 'Apple iCloud SSO'})`,
        bodyText: `Your institutional multi-chain account has been created and verified via ${provider === 'google' ? 'Google' : 'Apple iCloud'}. Welcome liquidity balances have been provisioned to your address.`,
        metadata: [
          { label: 'Authorized Identity', value: user.email },
          { label: 'Sign-in Provider', value: provider === 'google' ? 'Google Single Sign-On' : 'Apple iCloud ID' },
          { label: 'Custody Status', value: 'Multi-Sig Active' },
          { label: 'Referral Code', value: referralCode }
        ]
      });
    }

    const { password: _, ...userSafe } = user;
    return res.json({
      success: true,
      user: userSafe,
      provider,
      token: 'jwt_sso_' + user.id + '_' + Date.now()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'SSO authentication error' });
  }
});

// ----------------------------------------------------
// Market & System Overview APIs
// ----------------------------------------------------

app.get('/api/market/prices', (_req: Request, res: Response) => {
  return res.json({
    prices: ASSET_PRICES,
    source: 'Binance US Live Orderbook',
    status: binanceSyncStatus,
    lastSync: lastBinanceSync,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/market/binance', async (_req: Request, res: Response) => {
  await fetchBinanceLivePrices();
  return res.json({
    source: 'Binance US Official Real-Time API',
    status: binanceSyncStatus,
    lastSync: lastBinanceSync,
    tickers: ASSET_PRICES
  });
});

// ----------------------------------------------------
// Referral Program APIs
// ----------------------------------------------------

app.get('/api/referrals/stats', (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'usr_staker_002';
    const user = db.users.find((u) => u && u.id === userId) || db.users[1];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const refCode = user.referralCode || ('VAULT-' + (user.name || 'ALEX').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() + '-8821');
    const baseUrl = req.protocol + '://' + (req.get('host') || 'vaultstake.io');
    const referralLink = `${baseUrl}?ref=${refCode}`;

    const sampleReferred = [
      {
        id: 'ref_01',
        emailMasked: 'crypto.fund***@gmail.com',
        registeredAt: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
        volumeStakedUsd: 25000,
        commissionEarnedUsd: 2000.00,
        status: 'active_staker' as const
      },
      {
        id: 'ref_02',
        emailMasked: 'marcus.v***@proton.me',
        registeredAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        volumeStakedUsd: 14500,
        commissionEarnedUsd: 1160.00,
        status: 'active_staker' as const
      },
      {
        id: 'ref_03',
        emailMasked: 'hft.investor***@icloud.com',
        registeredAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        volumeStakedUsd: 3800,
        commissionEarnedUsd: 304.00,
        status: 'active_staker' as const
      }
    ];

    const totalVolumeStakedUsd = sampleReferred.reduce((sum, u) => sum + u.volumeStakedUsd, 0);
    const totalCommissionsEarnedUsd = sampleReferred.reduce((sum, u) => sum + u.commissionEarnedUsd, 0);
    const claimableCommissionUsd = user.referralClaimableUsd !== undefined ? user.referralClaimableUsd : 866.00;

    const referralTiers = [
      { tier: 1, name: 'Standard Staker Partner', ratePercent: 5.0, minStakers: 0, active: true },
      { tier: 2, name: 'Institutional Ambassador', ratePercent: 8.0, minStakers: 3, active: true },
      { tier: 3, name: 'VIP Protocol Syndicate', ratePercent: 12.0, minStakers: 10, active: false }
    ];

    return res.json({
      referralCode: refCode,
      referralLink,
      totalReferredUsers: sampleReferred.length + 5,
      activeStakersCount: sampleReferred.length,
      totalVolumeStakedUsd,
      totalCommissionsEarnedUsd,
      claimableCommissionUsd,
      commissionRatePercent: 8.0,
      referralTiers,
      referredUsers: sampleReferred
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching referral statistics' });
  }
});

app.post('/api/referrals/claim', (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'usr_staker_002';
    const user = db.users.find((u) => u && u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const claimAmountUsd = user.referralClaimableUsd !== undefined ? user.referralClaimableUsd : 866.00;

    if (claimAmountUsd <= 0) {
      return res.status(400).json({ error: 'No referral commissions currently available to claim.' });
    }

    user.walletBalances['USDT'] = Number(((user.walletBalances['USDT'] || 0) + claimAmountUsd).toFixed(2));
    user.referralClaimableUsd = 0;

    const claimTx = {
      id: 'tx_ref_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userEmail: user.email,
      type: 'reward_claim' as const,
      assetId: 'USDT' as const,
      amount: claimAmountUsd,
      amountUsd: claimAmountUsd,
      network: 'USDT Liquid Wallet',
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      notes: 'Referral Partner Commission Harvested (+8% Staker Yield Match)'
    };

    db.transactions.unshift(claimTx);
    saveDatabase(db);

    return res.json({
      success: true,
      claimedAmountUsd: claimAmountUsd,
      updatedBalances: user.walletBalances,
      transaction: claimTx
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error claiming referral commission' });
  }
});

app.get('/api/system/settings', (_req: Request, res: Response) => {
  // Compute live protocol-wide totals
  let liveStakedUsd = 0;
  for (const s of db.stakes) {
    if (s.status === 'active') {
      const price = ASSET_PRICES[s.assetId]?.priceUsd || 1;
      liveStakedUsd += s.amount * price;
    }
  }

  let liveClaimedUsd = 0;
  for (const t of db.transactions) {
    if ((t.type === 'reward_claim' || t.type === 'unstake') && t.status === 'completed') {
      liveClaimedUsd += (t.amountUsd || 0);
    }
  }

  const BASELINE_STAKED_USD = 48620450;
  const BASELINE_PAYOUT_USD = 14395120;
  const activeStakersCount = Math.max(14280, new Set(db.stakes.filter((s) => s.status === 'active').map((s) => s.userId)).size + 14275);

  const platformStats = {
    totalPlatformStakedUsd: Number((BASELINE_STAKED_USD + liveStakedUsd).toFixed(2)),
    totalPlatformPayoutUsd: Number((BASELINE_PAYOUT_USD + liveClaimedUsd).toFixed(2)),
    activeStakersCount,
    totalTransactionsCount: db.transactions.length + 86420,
    supportedChainsCount: Object.keys(db.depositAddresses).length
  };

  return res.json({
    settings: db.systemSettings,
    depositAddresses: db.depositAddresses,
    stakingPlans: db.stakingPlans,
    platformStats
  });
});

// ----------------------------------------------------
// Staking APIs & Real-Time Calculation
// ----------------------------------------------------

app.get('/api/staking/my-stakes', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'usr_staker_002';

  // Calculate real-time accrued rewards based on elapsed time and APY
  const now = Date.now();
  const userStakes = db.stakes
    .filter((s) => s.userId === userId)
    .map((stake) => {
      if (stake.status !== 'active') return stake;

      const lastClaimTime = new Date(stake.lastClaimDate || stake.startDate).getTime();
      const elapsedSeconds = Math.max(0, (now - lastClaimTime) / 1000);
      const secondsInYear = 365 * 24 * 3600;
      
      // APY formula: yield = amount * (apy / 100) * (elapsed / secondsInYear)
      const dynamicReward = (stake.amount * (stake.apy / 100) * elapsedSeconds) / secondsInYear;
      const totalAccrued = (stake.accruedRewards || 0) + dynamicReward;

      return {
        ...stake,
        currentAccruedRewards: Number(totalAccrued.toFixed(6)),
        currentAccruedUsd: Number((totalAccrued * (ASSET_PRICES[stake.assetId]?.priceUsd || 1)).toFixed(2))
      };
    });

  return res.json({ stakes: userStakes });
});

// Create Stake
app.post('/api/staking/create', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr_staker_002';
  const { assetId, planId, amount } = req.body;

  const numAmount = Number(amount);
  if (!assetId || !planId || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid staking parameters' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const availableBalance = user.walletBalances[assetId] || 0;
  if (availableBalance < numAmount) {
    return res.status(400).json({
      error: `Insufficient available ${assetId} balance. Available: ${availableBalance.toFixed(4)} ${assetId}`
    });
  }

  const plan = db.stakingPlans.find((p) => p.id === planId);
  if (!plan) {
    return res.status(404).json({ error: 'Selected staking plan not found' });
  }

  const assetPrice = ASSET_PRICES[assetId]?.priceUsd || 1;
  const stakeValueUsd = numAmount * assetPrice;

  if (stakeValueUsd < plan.minStakeUsd) {
    return res.status(400).json({
      error: `Minimum stake for this tier is $${plan.minStakeUsd.toLocaleString()} USD (~${(plan.minStakeUsd / assetPrice).toFixed(4)} ${assetId})`
    });
  }

  // Deduct from available balance
  user.walletBalances[assetId] = Number((availableBalance - numAmount).toFixed(6));

  const dailyReturnPercent = plan.dailyReturnPercent || (plan.apy ? Number((plan.apy / 365).toFixed(2)) : 1.5);
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + (plan.lockPeriodDays || 365) * 24 * 3600 * 1000);

  const newStake = {
    id: 'stk_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    assetId,
    planId: plan.id,
    planName: plan.name,
    amount: numAmount,
    amountUsd: Number(stakeValueUsd.toFixed(2)),
    dailyReturnPercent,
    apy: plan.apy,
    lockPeriodDays: plan.lockPeriodDays,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    lastClaimDate: startDate.toISOString(),
    accruedRewards: 0,
    status: 'active' as const
  };

  db.stakes.unshift(newStake);

  // Record transaction
  const newTx = {
    id: 'tx_stk_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    userEmail: user.email,
    type: 'stake' as const,
    assetId,
    amount: numAmount,
    amountUsd: Number(stakeValueUsd.toFixed(2)),
    network: ASSET_PRICES[assetId]?.network || 'Blockchain',
    status: 'completed' as const,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    notes: `Staked ${numAmount} ${assetId} in ${plan.name} (+${dailyReturnPercent}% Daily Returns)`
  };
  db.transactions.unshift(newTx);

  saveDatabase(db);

  // Send automated email notification
  createAndSendAutomatedEmail({
    userId: user.id,
    toEmail: user.email,
    subject: `Staking Position Confirmed: ${numAmount} ${assetId} in ${plan.name} (+${dailyReturnPercent}% Daily)`,
    eventType: 'stake_created',
    previewText: `Your ${numAmount} ${assetId} staking position is now active and earning ${dailyReturnPercent}% daily returns (${plan.apy}% APY).`,
    heading: 'Daily Staking Position Activated',
    bodyText: `Congratulations! Your staking commitment of ${numAmount} ${assetId} has been deposited into the ${plan.name} contract and is now earning guaranteed daily returns of ${dailyReturnPercent}% per day with 100% flexible unstaking.`,
    metadata: [
      { label: 'Staked Asset', value: `${numAmount} ${assetId}` },
      { label: 'Staking Tier', value: plan.name },
      { label: 'Daily Return Rate', value: `+${dailyReturnPercent}% / Day`, color: '#10b981' },
      { label: 'Equivalent APY', value: `${plan.apy}% APY`, color: '#10b981' },
      { label: 'Redemption Terms', value: '100% Flexible · Unstake Anytime' },
      { label: 'Payout Schedule', value: 'Daily Return Credited Continuously' }
    ]
  });

  return res.json({
    success: true,
    stake: newStake,
    updatedBalances: user.walletBalances
  });
});

// Claim Rewards
app.post('/api/staking/claim-rewards', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr_staker_002';
  const { stakeId } = req.body;

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stake = db.stakes.find((s) => s.id === stakeId && s.userId === userId);
  if (!stake || stake.status !== 'active') {
    return res.status(404).json({ error: 'Active stake position not found' });
  }

  // Calculate rewards accrued since lastClaimDate based on daily returns
  const now = Date.now();
  const lastClaimTime = new Date(stake.lastClaimDate || stake.startDate).getTime();
  const elapsedSeconds = Math.max(0, (now - lastClaimTime) / 1000);
  const dailyRate = (stake.dailyReturnPercent || (stake.apy / 365) || 1.0) / 100;
  const newReward = stake.amount * dailyRate * (elapsedSeconds / 86400);
  const totalRewardToClaim = Number(((stake.accruedRewards || 0) + newReward).toFixed(6));

  if (totalRewardToClaim <= 0.000001) {
    return res.status(400).json({ error: 'No accumulated rewards available to claim at this moment.' });
  }

  // Credit user available balance
  user.walletBalances[stake.assetId] = Number(((user.walletBalances[stake.assetId] || 0) + totalRewardToClaim).toFixed(6));

  // Reset stake accrued rewards and update lastClaimDate
  stake.accruedRewards = 0;
  stake.lastClaimDate = new Date().toISOString();

  const assetPrice = ASSET_PRICES[stake.assetId]?.priceUsd || 1;
  const rewardUsd = totalRewardToClaim * assetPrice;

  // Record transaction
  const claimTx = {
    id: 'tx_clm_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    userEmail: user.email,
    type: 'reward_claim' as const,
    assetId: stake.assetId,
    amount: totalRewardToClaim,
    amountUsd: Number(rewardUsd.toFixed(2)),
    network: ASSET_PRICES[stake.assetId]?.network || 'Staking Contract',
    status: 'completed' as const,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    notes: `Claimed ${totalRewardToClaim} ${stake.assetId} staking yield rewards`
  };
  db.transactions.unshift(claimTx);

  saveDatabase(db);

  // Send automated email notification
  createAndSendAutomatedEmail({
    userId: user.id,
    toEmail: user.email,
    subject: `Staking Yield Claimed: +${totalRewardToClaim} ${stake.assetId} Transferred to Wallet`,
    eventType: 'reward_claimed',
    previewText: `You claimed ${totalRewardToClaim} ${stake.assetId} in staking rewards.`,
    heading: 'Staking Yield Payout Dispatched',
    bodyText: `Your accumulated yield of ${totalRewardToClaim} ${stake.assetId} (~$${rewardUsd.toFixed(2)} USD) has been credited directly to your available wallet balance.`,
    metadata: [
      { label: 'Amount Claimed', value: `+${totalRewardToClaim} ${stake.assetId}`, color: '#10b981' },
      { label: 'USD Equivalent', value: `$${rewardUsd.toFixed(2)} USD` },
      { label: 'Source Staking Pool', value: stake.planName },
      { label: 'Current Wallet Balance', value: `${user.walletBalances[stake.assetId]} ${stake.assetId}` }
    ]
  });

  return res.json({
    success: true,
    claimedAmount: totalRewardToClaim,
    updatedBalances: user.walletBalances,
    stake
  });
});

// Unstake Principal
app.post('/api/staking/unstake', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr_staker_002';
  const { stakeId } = req.body;

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stake = db.stakes.find((s) => s.id === stakeId && s.userId === userId);
  if (!stake || stake.status !== 'active') {
    return res.status(404).json({ error: 'Active stake position not found' });
  }

  // Check lock maturity
  const now = Date.now();
  const endDate = new Date(stake.endDate).getTime();
  const isMatured = stake.lockPeriodDays === 0 || now >= endDate;

  // Accrue any final rewards based on daily returns
  const lastClaimTime = new Date(stake.lastClaimDate || stake.startDate).getTime();
  const elapsedSeconds = Math.max(0, (now - lastClaimTime) / 1000);
  const dailyRate = (stake.dailyReturnPercent || (stake.apy / 365) || 1.0) / 100;
  const finalReward = Number((stake.amount * dailyRate * (elapsedSeconds / 86400)).toFixed(6));

  const totalReturn = stake.amount + finalReward;

  // Credit user available balance
  user.walletBalances[stake.assetId] = Number(((user.walletBalances[stake.assetId] || 0) + totalReturn).toFixed(6));
  stake.status = 'unstaked';
  stake.accruedRewards = 0;

  // Record transaction
  const unstakeTx = {
    id: 'tx_unstk_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    userEmail: user.email,
    type: 'unstake' as const,
    assetId: stake.assetId,
    amount: stake.amount,
    amountUsd: Number((stake.amount * (ASSET_PRICES[stake.assetId]?.priceUsd || 1)).toFixed(2)),
    network: ASSET_PRICES[stake.assetId]?.network || 'Staking Contract',
    status: 'completed' as const,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    notes: `Unstaked ${stake.amount} ${stake.assetId} from ${stake.planName} (+${finalReward} final reward)`
  };
  db.transactions.unshift(unstakeTx);

  saveDatabase(db);

  createAndSendAutomatedEmail({
    userId: user.id,
    toEmail: user.email,
    subject: `Staking Principal Released: ${stake.amount} ${stake.assetId}`,
    eventType: 'security_alert',
    previewText: `Your principal of ${stake.amount} ${stake.assetId} has been unlocked and returned to your balance.`,
    heading: 'Staking Position Closed',
    bodyText: `Your staking position in ${stake.planName} has been unstaked. The principal amount of ${stake.amount} ${stake.assetId} plus final rewards of ${finalReward} ${stake.assetId} has been credited to your available balance.`,
    metadata: [
      { label: 'Unstaked Principal', value: `${stake.amount} ${stake.assetId}` },
      { label: 'Final Reward Added', value: `+${finalReward} ${stake.assetId}`, color: '#10b981' },
      { label: 'Pool', value: stake.planName },
      { label: 'Status', value: 'Completed' }
    ]
  });

  return res.json({
    success: true,
    returnedAmount: totalReturn,
    updatedBalances: user.walletBalances,
    stake
  });
});

// ----------------------------------------------------
// Multi-Chain Wallet: Deposits & Withdrawals
// ----------------------------------------------------

// User requests deposit with transaction proof (TXID)
app.post('/api/wallet/deposit', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr_staker_002';
  const { assetId, amount, txHash, network } = req.body;

  const numAmount = Number(amount);
  if (!assetId || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid deposit amount and asset are required' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const assetInfo = ASSET_PRICES[assetId];
  const amountUsd = numAmount * (assetInfo?.priceUsd || 1);

  const depositTx = {
    id: 'tx_dep_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    userEmail: user.email,
    type: 'deposit' as const,
    assetId,
    amount: numAmount,
    amountUsd: Number(amountUsd.toFixed(2)),
    network: network || assetInfo?.network || 'Blockchain',
    txHash: txHash ? txHash.trim() : undefined,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    notes: `Deposit submitted by user. Awaiting administrator blockchain confirmation.`
  };

  db.transactions.unshift(depositTx);
  saveDatabase(db);

  // Send automated email notification to user
  createAndSendAutomatedEmail({
    userId: user.id,
    toEmail: user.email,
    subject: `Deposit Initiated: ${numAmount} ${assetId} (Pending Confirmation)`,
    eventType: 'deposit_received',
    previewText: `We have registered your deposit request of ${numAmount} ${assetId}. Verification is in progress.`,
    heading: 'Deposit Request Registered',
    bodyText: `Your deposit request for ${numAmount} ${assetId} (~$${amountUsd.toFixed(2)} USD) has been received. Our automated node validator and compliance audit team are verifying the transaction on the network.`,
    metadata: [
      { label: 'Asset', value: `${numAmount} ${assetId}` },
      { label: 'Network', value: depositTx.network },
      { label: 'Transaction Hash', value: txHash || 'Pending confirmation' },
      { label: 'Current Status', value: 'Pending Validation', color: '#f59e0b' }
    ]
  });

  return res.json({
    success: true,
    transaction: depositTx
  });
});

// User requests withdrawal
app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr_staker_002';
  const { assetId, amount, destinationAddress, network } = req.body;

  const numAmount = Number(amount);
  if (!assetId || isNaN(numAmount) || numAmount <= 0 || !destinationAddress) {
    return res.status(400).json({ error: 'Valid amount, asset, and destination address are required' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const currentBalance = user.walletBalances[assetId] || 0;
  const assetInfo = ASSET_PRICES[assetId];
  const fee = assetInfo?.withdrawalFee || 0;
  const totalDeduction = numAmount + fee;

  if (currentBalance < totalDeduction) {
    return res.status(400).json({
      error: `Insufficient balance for withdrawal + network fee. Available: ${currentBalance.toFixed(4)} ${assetId}, required: ${totalDeduction.toFixed(4)} ${assetId}`
    });
  }

  // Deduct/reserve funds immediately to prevent double spending
  user.walletBalances[assetId] = Number((currentBalance - totalDeduction).toFixed(6));

  const amountUsd = numAmount * (assetInfo?.priceUsd || 1);

  const withdrawTx = {
    id: 'tx_wdr_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    userEmail: user.email,
    type: 'withdrawal' as const,
    assetId,
    amount: numAmount,
    amountUsd: Number(amountUsd.toFixed(2)),
    network: network || assetInfo?.network || 'Blockchain',
    toAddress: destinationAddress.trim(),
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    notes: `Withdrawal request submitted. Network fee: ${fee} ${assetId}. Awaiting admin authorization.`
  };

  db.transactions.unshift(withdrawTx);
  saveDatabase(db);

  // Send automated email notification
  createAndSendAutomatedEmail({
    userId: user.id,
    toEmail: user.email,
    subject: `Withdrawal Authorized & Queued: ${numAmount} ${assetId}`,
    eventType: 'withdrawal_requested',
    previewText: `Your withdrawal of ${numAmount} ${assetId} to ${destinationAddress.substring(0, 10)}... is pending security clearance.`,
    heading: 'Withdrawal Request Submitted',
    bodyText: `A withdrawal request for ${numAmount} ${assetId} (~$${amountUsd.toFixed(2)} USD) has been queued from your account. Cold-vault multi-sig signers have been notified.`,
    metadata: [
      { label: 'Amount', value: `${numAmount} ${assetId}` },
      { label: 'Network Fee', value: `${fee} ${assetId}` },
      { label: 'Destination Address', value: `${destinationAddress.substring(0, 14)}...${destinationAddress.slice(-8)}` },
      { label: 'Status', value: 'Pending Multi-Sig Approval', color: '#f59e0b' }
    ]
  });

  return res.json({
    success: true,
    transaction: withdrawTx,
    updatedBalances: user.walletBalances
  });
});

// User transaction history
app.get('/api/wallet/transactions', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'usr_staker_002';
  const user = db.users.find((u) => u.id === userId);

  let txList = db.transactions;
  if (user && user.role !== 'admin') {
    txList = db.transactions.filter((t) => t.userId === userId);
  }

  return res.json({ transactions: txList });
});

// User Tax & Staking History CSV Export
app.get('/api/wallet/export-tax-csv', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'usr_staker_002';
  const user = db.users.find((u) => u.id === userId) || db.users[1];

  const userEmail = user?.email || 'user@vaultstake.io';
  const userTxs = db.transactions.filter((t) => t.userId === userId || t.userEmail === userEmail);
  const userStakes = db.stakes.filter((s) => s.userId === userId);

  const csvRows: string[][] = [
    [
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
    ]
  ];

  // Helper to determine tax classification
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

  // Add all transactions
  for (const tx of userTxs) {
    const price = ASSET_PRICES[tx.assetId]?.priceUsd || 1;
    const assetName = ASSET_PRICES[tx.assetId]?.name || tx.assetId;
    csvRows.push([
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

  // Add all staking positions as position ledger entries
  for (const s of userStakes) {
    const price = ASSET_PRICES[s.assetId]?.priceUsd || 1;
    const assetName = ASSET_PRICES[s.assetId]?.name || s.assetId;
    csvRows.push([
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

  const csvContent = '\uFEFF' + csvRows.map((row) => row.join(',')).join('\n');
  const safeFilename = `vaultstake-tax-staking-report-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  return res.send(csvContent);
});

// User notifications & emails
app.get('/api/notifications/emails', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'usr_staker_002';
  const user = db.users.find((u) => u.id === userId);

  let emailList = db.emails;
  if (user && user.role !== 'admin') {
    emailList = db.emails.filter((e) => e.userId === userId || e.toEmail === user.email);
  }

  return res.json({ emails: emailList });
});

// Support ticket submission
app.post('/api/support/ticket', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'usr_staker_002';
  const { subject, category, message, userEmail } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const ticket = {
    id: 'tkt_' + Math.random().toString(36).substring(2, 9),
    userId,
    userEmail: userEmail || 'user@vaultstake.io',
    subject: subject.trim(),
    category: category || 'general',
    message: message.trim(),
    status: 'open' as const,
    createdAt: new Date().toISOString()
  };

  db.supportTickets.unshift(ticket);
  saveDatabase(db);

  return res.json({
    success: true,
    ticket,
    supportLinks: {
      whatsapp: db.systemSettings.whatsappUrl,
      telegram: db.systemSettings.telegramUrl
    }
  });
});

// ----------------------------------------------------
// Admin Management APIs
// ----------------------------------------------------

// Admin Overview & Metrics
app.get('/api/admin/overview', (_req: Request, res: Response) => {
  // Compute Total Assets Under Management (AUM) = sum of all user balances + staked assets in USD
  let totalWalletUsd = 0;
  const assetTotals: Record<string, number> = {
    BTC: 0,
    ETH: 0,
    SOL: 0,
    USDT: 0,
    USDC: 0,
    BNB: 0,
    AVAX: 0
  };

  // Add balances from all users
  for (const u of db.users) {
    for (const [asset, bal] of Object.entries(u.walletBalances)) {
      if (assetTotals[asset] !== undefined) {
        assetTotals[asset] += bal;
      }
    }
  }

  // Add active staked assets
  let totalTvlUsd = 0;
  for (const s of db.stakes) {
    if (s.status === 'active') {
      const price = ASSET_PRICES[s.assetId]?.priceUsd || 1;
      const usdVal = s.amount * price;
      totalTvlUsd += usdVal;
      if (assetTotals[s.assetId] !== undefined) {
        assetTotals[s.assetId] += s.amount;
      }
    }
  }

  // Total AUM calculation
  let totalAumUsd = 0;
  const assetDistribution = Object.entries(assetTotals).map(([assetId, amount]) => {
    const price = ASSET_PRICES[assetId]?.priceUsd || 1;
    const amountUsd = amount * price;
    totalAumUsd += amountUsd;
    return {
      assetId,
      amount: Number(amount.toFixed(4)),
      amountUsd: Number(amountUsd.toFixed(2)),
      percentage: 0 // Will compute below
    };
  });

  // Calculate percentages
  for (const item of assetDistribution) {
    item.percentage = totalAumUsd > 0 ? Number(((item.amountUsd / totalAumUsd) * 100).toFixed(1)) : 0;
  }

  // Count pending items
  const pendingDepositsCount = db.transactions.filter((t) => t.type === 'deposit' && t.status === 'pending').length;
  const pendingWithdrawalsCount = db.transactions.filter((t) => t.type === 'withdrawal' && t.status === 'pending').length;
  const activeStakersCount = new Set(db.stakes.filter((s) => s.status === 'active').map((s) => s.userId)).size;

  // Compute rewards paid out
  let liveClaimedUsd = 0;
  for (const t of db.transactions) {
    if ((t.type === 'reward_claim' || t.type === 'unstake') && t.status === 'completed') {
      liveClaimedUsd += (t.amountUsd || 0);
    }
  }
  const totalPaidRewardsUsd = Number((14395120 + liveClaimedUsd).toFixed(2));
  const totalPlatformStakedUsd = Number((48620450 + totalTvlUsd).toFixed(2));

  return res.json({
    metrics: {
      totalAumUsd: Number(totalAumUsd.toFixed(2)),
      totalTvlUsd: Number(totalTvlUsd.toFixed(2)),
      totalPlatformStakedUsd,
      totalPaidRewardsUsd,
      totalUsersCount: db.users.length,
      activeStakersCount,
      pendingDepositsCount,
      pendingWithdrawalsCount,
      totalTransactionsCount: db.transactions.length,
      assetDistribution
    },
    systemSettings: db.systemSettings
  });
});

// Admin: Approve Deposit
app.post('/api/admin/deposits/approve', (req: Request, res: Response) => {
  const { transactionId, adminNote } = req.body;
  const tx = db.transactions.find((t) => t.id === transactionId && t.type === 'deposit');

  if (!tx) {
    return res.status(404).json({ error: 'Deposit transaction not found' });
  }

  if (tx.status !== 'pending') {
    return res.status(400).json({ error: `Transaction is already ${tx.status}` });
  }

  const user = db.users.find((u) => u.id === tx.userId);
  if (!user) {
    return res.status(404).json({ error: 'Associated user account not found' });
  }

  // Credit user wallet balance!
  user.walletBalances[tx.assetId] = Number(((user.walletBalances[tx.assetId] || 0) + tx.amount).toFixed(6));

  tx.status = 'approved';
  tx.completedAt = new Date().toISOString();
  if (adminNote) tx.adminNote = adminNote;

  saveDatabase(db);

  // Send automated email notification to user
  createAndSendAutomatedEmail({
    userId: user.id,
    toEmail: user.email,
    subject: `Deposit Confirmed: ${tx.amount} ${tx.assetId} Credited to Your Account`,
    eventType: 'deposit_approved',
    previewText: `Your deposit of ${tx.amount} ${tx.assetId} has been verified and credited to your wallet.`,
    heading: 'Deposit Successfully Credited',
    bodyText: `Your deposit of ${tx.amount} ${tx.assetId} (~$${tx.amountUsd.toLocaleString()} USD) has been audited and approved by the custody admin desk. The funds are now available in your balance.`,
    metadata: [
      { label: 'Credited Amount', value: `+${tx.amount} ${tx.assetId}`, color: '#10b981' },
      { label: 'Asset & Network', value: `${tx.assetId} (${tx.network})` },
      { label: 'Blockchain TXID', value: tx.txHash || 'Verified on-chain' },
      { label: 'New Balance', value: `${user.walletBalances[tx.assetId]} ${tx.assetId}` },
      { label: 'Admin Note', value: adminNote || 'Confirmed and cleared' }
    ]
  });

  return res.json({
    success: true,
    transaction: tx,
    userNewBalance: user.walletBalances[tx.assetId]
  });
});

// Admin: Reject Deposit
app.post('/api/admin/deposits/reject', (req: Request, res: Response) => {
  const { transactionId, reason } = req.body;
  const tx = db.transactions.find((t) => t.id === transactionId && t.type === 'deposit');

  if (!tx) {
    return res.status(404).json({ error: 'Deposit transaction not found' });
  }

  tx.status = 'rejected';
  tx.completedAt = new Date().toISOString();
  tx.adminNote = reason || 'Deposit could not be verified on the specified blockchain network.';

  saveDatabase(db);

  const user = db.users.find((u) => u.id === tx.userId);
  if (user) {
    createAndSendAutomatedEmail({
      userId: user.id,
      toEmail: user.email,
      subject: `Deposit Verification Update: ${tx.amount} ${tx.assetId}`,
      eventType: 'deposit_rejected',
      previewText: `Your deposit request could not be completed. Reason: ${tx.adminNote}`,
      heading: 'Deposit Verification Notice',
      bodyText: `We were unable to verify your deposit of ${tx.amount} ${tx.assetId}. Please review the rejection reason and contact support via Telegram or WhatsApp if you need help.`,
      metadata: [
        { label: 'Attempted Amount', value: `${tx.amount} ${tx.assetId}` },
        { label: 'Status', value: 'Rejected', color: '#ef4444' },
        { label: 'Reason', value: tx.adminNote || 'Verification unsuccessful' }
      ]
    });
  }

  return res.json({
    success: true,
    transaction: tx
  });
});

// Admin: Approve Withdrawal
app.post('/api/admin/withdrawals/approve', (req: Request, res: Response) => {
  const { transactionId, payoutTxHash, adminNote } = req.body;
  const tx = db.transactions.find((t) => t.id === transactionId && t.type === 'withdrawal');

  if (!tx) {
    return res.status(404).json({ error: 'Withdrawal transaction not found' });
  }

  if (tx.status !== 'pending') {
    return res.status(400).json({ error: `Withdrawal is already ${tx.status}` });
  }

  const generatedTxHash = payoutTxHash || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  tx.status = 'completed';
  tx.txHash = generatedTxHash;
  tx.completedAt = new Date().toISOString();
  if (adminNote) tx.adminNote = adminNote;

  saveDatabase(db);

  const user = db.users.find((u) => u.id === tx.userId);
  if (user) {
    createAndSendAutomatedEmail({
      userId: user.id,
      toEmail: user.email,
      subject: `Withdrawal Dispatched: ${tx.amount} ${tx.assetId} Sent to Your Address`,
      eventType: 'withdrawal_completed',
      previewText: `Your withdrawal of ${tx.amount} ${tx.assetId} has been broadcasted to the network.`,
      heading: 'Withdrawal Dispatched Successfully',
      bodyText: `Your requested withdrawal of ${tx.amount} ${tx.assetId} has been authorized and dispatched from our multi-sig vault.`,
      metadata: [
        { label: 'Dispatched Amount', value: `${tx.amount} ${tx.assetId}`, color: '#10b981' },
        { label: 'Destination Address', value: tx.toAddress || 'External Wallet' },
        { label: 'Payout TXID', value: generatedTxHash },
        { label: 'Status', value: 'Broadcasted to Blockchain', color: '#10b981' }
      ]
    });
  }

  return res.json({
    success: true,
    transaction: tx
  });
});

// Admin: Reject Withdrawal (Refunds user balance)
app.post('/api/admin/withdrawals/reject', (req: Request, res: Response) => {
  const { transactionId, reason } = req.body;
  const tx = db.transactions.find((t) => t.id === transactionId && t.type === 'withdrawal');

  if (!tx) {
    return res.status(404).json({ error: 'Withdrawal transaction not found' });
  }

  if (tx.status !== 'pending') {
    return res.status(400).json({ error: `Withdrawal is already ${tx.status}` });
  }

  const user = db.users.find((u) => u.id === tx.userId);
  if (user) {
    // Refund the reserved amount plus fee
    const fee = ASSET_PRICES[tx.assetId]?.withdrawalFee || 0;
    const refundAmount = tx.amount + fee;
    user.walletBalances[tx.assetId] = Number(((user.walletBalances[tx.assetId] || 0) + refundAmount).toFixed(6));
  }

  tx.status = 'rejected';
  tx.completedAt = new Date().toISOString();
  tx.adminNote = reason || 'Withdrawal canceled by security audit.';

  saveDatabase(db);

  if (user) {
    createAndSendAutomatedEmail({
      userId: user.id,
      toEmail: user.email,
      subject: `Withdrawal Request Rejected & Balance Restored: ${tx.amount} ${tx.assetId}`,
      eventType: 'withdrawal_rejected',
      previewText: `Your withdrawal could not be processed. Funds have been refunded to your wallet balance.`,
      heading: 'Withdrawal Cancelled & Funds Restored',
      bodyText: `Your withdrawal request for ${tx.amount} ${tx.assetId} was not approved. The full reserved amount (including network fees) has been immediately restored to your available wallet balance.`,
      metadata: [
        { label: 'Refunded Amount', value: `+${tx.amount} ${tx.assetId}`, color: '#10b981' },
        { label: 'Reason', value: tx.adminNote || 'Security clearance rejected' },
        { label: 'Status', value: 'Restored to Wallet Balance' }
      ]
    });
  }

  return res.json({
    success: true,
    transaction: tx,
    userNewBalance: user ? user.walletBalances[tx.assetId] : undefined
  });
});

// Admin: Update Deposit Addresses Configuration
app.post('/api/admin/deposit-addresses', (req: Request, res: Response) => {
  const { assetId, address, chainName, networkType, confirmationsRequired, notes } = req.body;

  if (!assetId || !address) {
    return res.status(400).json({ error: 'AssetId and Address are required' });
  }

  db.depositAddresses[assetId] = {
    assetId,
    chainName: chainName || db.depositAddresses[assetId]?.chainName || `${assetId} Network`,
    networkType: networkType || db.depositAddresses[assetId]?.networkType || 'Mainnet',
    address: address.trim(),
    confirmationsRequired: Number(confirmationsRequired) || 2,
    notes: notes || db.depositAddresses[assetId]?.notes || 'Deposit address updated by administrator.'
  };

  saveDatabase(db);

  return res.json({
    success: true,
    updatedConfig: db.depositAddresses[assetId],
    allAddresses: db.depositAddresses
  });
});

// Admin: Update WhatsApp and Telegram Support Details
app.post('/api/admin/support-settings', (req: Request, res: Response) => {
  const { whatsappNumber, whatsappUrl, telegramHandle, telegramUrl, supportGreeting } = req.body;

  if (whatsappNumber !== undefined) db.systemSettings.whatsappNumber = whatsappNumber.trim();
  if (whatsappUrl !== undefined) db.systemSettings.whatsappUrl = whatsappUrl.trim();
  if (telegramHandle !== undefined) db.systemSettings.telegramHandle = telegramHandle.trim();
  if (telegramUrl !== undefined) db.systemSettings.telegramUrl = telegramUrl.trim();
  if (supportGreeting !== undefined) db.systemSettings.supportGreeting = supportGreeting.trim();

  saveDatabase(db);

  return res.json({
    success: true,
    systemSettings: db.systemSettings
  });
});

// Admin: Update Staking Plan (Fully Editable)
app.post('/api/admin/staking-plans', (req: Request, res: Response) => {
  const { planId, name, tagline, dailyReturnPercent, apy, minStakeUsd, maxStakeUsd, lockPeriodDays, isPopular, features } = req.body;

  const plan = db.stakingPlans.find((p) => p.id === planId);
  if (!plan) {
    return res.status(404).json({ error: 'Staking plan not found' });
  }

  if (name !== undefined) plan.name = name.trim();
  if (tagline !== undefined) plan.tagline = tagline.trim();
  if (dailyReturnPercent !== undefined) {
    plan.dailyReturnPercent = Number(dailyReturnPercent);
    if (apy === undefined) {
      plan.apy = Number((plan.dailyReturnPercent * 365).toFixed(1));
    }
  }
  if (apy !== undefined) {
    plan.apy = Number(apy);
    if (dailyReturnPercent === undefined) {
      plan.dailyReturnPercent = Number((plan.apy / 365).toFixed(2));
    }
  }
  if (minStakeUsd !== undefined) plan.minStakeUsd = Number(minStakeUsd);
  if (maxStakeUsd !== undefined) plan.maxStakeUsd = Number(maxStakeUsd);
  if (lockPeriodDays !== undefined) plan.lockPeriodDays = Number(lockPeriodDays);
  if (isPopular !== undefined) plan.isPopular = Boolean(isPopular);
  if (features !== undefined && Array.isArray(features)) plan.features = features;

  saveDatabase(db);

  return res.json({
    success: true,
    plan,
    allPlans: db.stakingPlans
  });
});

// Admin: Create New Staking Plan
app.post('/api/admin/staking-plans/create', (req: Request, res: Response) => {
  const { name, tagline, dailyReturnPercent, apy, minStakeUsd, maxStakeUsd, lockPeriodDays, isPopular, features } = req.body;

  if (!name || (dailyReturnPercent === undefined && apy === undefined)) {
    return res.status(400).json({ error: 'Plan name and daily return rate (or APY) are required' });
  }

  const dailyReturn = dailyReturnPercent !== undefined
    ? Number(dailyReturnPercent)
    : Number((Number(apy) / 365).toFixed(2));
  const apyRate = apy !== undefined
    ? Number(apy)
    : Number((dailyReturn * 365).toFixed(1));

  const newPlan = {
    id: 'plan_' + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    tagline: (tagline || `Earn ${dailyReturn}% daily returns with continuous block yield`).trim(),
    dailyReturnPercent: dailyReturn,
    apy: apyRate,
    lockPeriodDays: lockPeriodDays !== undefined ? Number(lockPeriodDays) : 0,
    minStakeUsd: Number(minStakeUsd) || 50,
    maxStakeUsd: Number(maxStakeUsd) || 1000000,
    features: Array.isArray(features) && features.length > 0 ? features : [
      `${dailyReturn}% daily return credited to balance`,
      '100% flexible unstaking anytime',
      'Daily compounding rewards',
      'Institutional multi-sig security'
    ],
    isPopular: Boolean(isPopular)
  };

  db.stakingPlans.push(newPlan);
  saveDatabase(db);

  return res.json({
    success: true,
    plan: newPlan,
    allPlans: db.stakingPlans
  });
});

// Admin: Delete Staking Plan
app.post('/api/admin/staking-plans/delete', (req: Request, res: Response) => {
  const { planId } = req.body;

  const initialLength = db.stakingPlans.length;
  db.stakingPlans = db.stakingPlans.filter((p) => p.id !== planId);

  if (db.stakingPlans.length === initialLength) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  saveDatabase(db);

  return res.json({
    success: true,
    allPlans: db.stakingPlans
  });
});

// Admin: Export Ledger CSV
app.get('/api/admin/export-ledger', (_req: Request, res: Response) => {
  const headers = ['ID', 'User Email', 'Type', 'Asset', 'Amount', 'Amount USD', 'Network', 'TX Hash / Destination', 'Status', 'Date'];
  const rows = db.transactions.map((t) => [
    t.id,
    t.userEmail,
    t.type.toUpperCase(),
    t.assetId,
    t.amount,
    t.amountUsd,
    `"${t.network}"`,
    `"${t.txHash || t.toAddress || ''}"`,
    t.status.toUpperCase(),
    t.createdAt
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="vaultstake-ledger-audit.csv"');
  return res.send(csvContent);
});

// Global JSON Error Handler for API routes
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Internal server error occurred' });
  }
});

// ----------------------------------------------------
// Dev & Production Vite Middleware mounting
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite middleware in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VaultStake Full-Stack Server running at http://0.0.0.0:${PORT}`);
    // Trigger initial Binance live ticker pull and start interval
    fetchBinanceLivePrices();
    setInterval(fetchBinanceLivePrices, 25000);
  });
}

startServer();
