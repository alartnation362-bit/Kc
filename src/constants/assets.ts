export const IMAGES = {
  heroVault: '/src/assets/images/staking_hero_vault_1793673397973.jpg',
  securityVault: '/src/assets/images/security_custody_vault_1793673397262.jpg',
  yieldNodes: '/src/assets/images/yield_analytics_nodes_1793673398269.jpg',
  adminAvatar: '/src/assets/images/admin_avatar_executive_1793673397547.jpg'
};

export interface TokenMeta {
  id: string;
  symbol: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  networkBadge: string;
}

export const TOKEN_METAS: Record<string, TokenMeta> = {
  BTC: {
    id: 'BTC',
    symbol: 'BTC',
    name: 'Bitcoin',
    color: '#F7931A',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
    networkBadge: 'SegWit'
  },
  ETH: {
    id: 'ETH',
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400',
    networkBadge: 'ERC-20'
  },
  SOL: {
    id: 'SOL',
    symbol: 'SOL',
    name: 'Solana',
    color: '#14F195',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    networkBadge: 'SPL'
  },
  USDT: {
    id: 'USDT',
    symbol: 'USDT',
    name: 'Tether USD',
    color: '#26A17B',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-400',
    networkBadge: 'TRC/ERC'
  },
  USDC: {
    id: 'USDC',
    symbol: 'USDC',
    name: 'USD Coin',
    color: '#2775CA',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    networkBadge: 'ERC-20'
  },
  BNB: {
    id: 'BNB',
    symbol: 'BNB',
    name: 'BNB Chain',
    color: '#F3BA2F',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    networkBadge: 'BEP-20'
  },
  AVAX: {
    id: 'AVAX',
    symbol: 'AVAX',
    name: 'Avalanche',
    color: '#E84142',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    networkBadge: 'C-Chain'
  }
};
