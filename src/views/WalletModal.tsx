import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { SupportedAssetId, DepositAddressConfig } from '../types/crypto';
import { TOKEN_METAS } from '../constants/assets';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'deposit' | 'withdraw';
  initialAsset?: SupportedAssetId;
  depositAddresses: Record<string, DepositAddressConfig>;
  assetPrices: Record<string, { priceUsd: number; change24h: number; name: string; symbol: string; network: string; withdrawalFee: number }>;
  onSuccessTransaction?: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'deposit',
  initialAsset = 'ETH',
  depositAddresses,
  assetPrices,
  onSuccessTransaction
}) => {
  const { user, refreshUser } = useAuth();
  const [mode, setMode] = useState<'deposit' | 'withdraw'>(defaultMode);
  const [selectedAsset, setSelectedAsset] = useState<SupportedAssetId>(initialAsset);

  // Deposit state
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositSuccessData, setDepositSuccessData] = useState<any>(null);

  // Withdrawal state
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccessData, setWithdrawSuccessData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    setSelectedAsset(initialAsset);
  }, [initialAsset]);

  const currentAddressConfig = depositAddresses[selectedAsset] || {
    address: '0x71C8A3926B97C29b552b86F0d7Eb82136979A27D',
    chainName: `${selectedAsset} Network`,
    networkType: 'Mainnet',
    confirmationsRequired: 2,
    notes: 'Official VaultStake custody wallet.'
  };

  const assetInfo = assetPrices[selectedAsset] || {
    priceUsd: 1,
    change24h: 0,
    name: selectedAsset,
    symbol: selectedAsset,
    network: 'Mainnet',
    withdrawalFee: 0.001
  };

  // Generate QR code whenever asset/address changes
  useEffect(() => {
    if (currentAddressConfig?.address) {
      QRCode.toDataURL(currentAddressConfig.address, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [selectedAsset, currentAddressConfig?.address]);

  const handleCopy = () => {
    if (!currentAddressConfig?.address) return;
    navigator.clipboard.writeText(currentAddressConfig.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const res = await api.wallet.deposit(selectedAsset, amountNum, txHash, currentAddressConfig.chainName);
      setDepositSuccessData(res.transaction);
      if (onSuccessTransaction) onSuccessTransaction();
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Deposit submission failed');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const availableBalance = user?.walletBalances?.[selectedAsset] || 0;
  const withdrawalFee = assetInfo.withdrawalFee || 0;
  const netWithdrawal = Math.max(0, parseFloat(withdrawAmount || '0'));

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }

    if (!withdrawAddress.trim()) {
      setErrorMsg('Please enter a destination wallet address.');
      return;
    }

    if (amountNum + withdrawalFee > availableBalance) {
      setErrorMsg(
        `Insufficient balance. Amount (${amountNum}) + Network Fee (${withdrawalFee}) exceeds available balance (${availableBalance.toFixed(4)} ${selectedAsset}).`
      );
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const res = await api.wallet.withdraw(selectedAsset, amountNum, withdrawAddress, assetInfo.network);
      setWithdrawSuccessData(res.transaction);
      if (onSuccessTransaction) onSuccessTransaction();
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Withdrawal submission failed');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const resetModals = () => {
    setDepositSuccessData(null);
    setWithdrawSuccessData(null);
    setDepositAmount('');
    setTxHash('');
    setWithdrawAmount('');
    setWithdrawAddress('');
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  const supportedAssets: SupportedAssetId[] = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'AVAX'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 my-8 animate-in fade-in duration-200 text-slate-900 dark:text-white">
        {/* Header with Mode Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setMode('deposit');
                setErrorMsg(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'deposit'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Deposit Crypto</span>
            </button>
            <button
              onClick={() => {
                setMode('withdraw');
                setErrorMsg(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'withdraw'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw Funds</span>
            </button>
          </div>

          <button
            onClick={resetModals}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Asset Selector Strip */}
        <div className="pt-4 pb-2">
          <label className="block text-[11px] font-medium text-slate-400 mb-2">
            Select Asset & Chain
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {supportedAssets.map((asset) => {
              const meta = TOKEN_METAS[asset];
              const isSelected = selectedAsset === asset;
              return (
                <button
                  key={asset}
                  type="button"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setErrorMsg(null);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta?.color || '#cbd5e1' }}
                  />
                  <span className="font-bold">{asset}</span>
                  <span className="text-[10px] opacity-75 font-mono">{meta?.networkBadge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ---------------- DEPOSIT TAB ---------------- */}
        {mode === 'deposit' && (
          <div>
            {depositSuccessData ? (
              <div className="py-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Deposit Proof Submitted</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Your deposit of <strong className="text-amber-400">{depositSuccessData.amount} {depositSuccessData.assetId}</strong> has been recorded and submitted to administrator review.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-left text-xs space-y-1.5 max-w-sm mx-auto font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Reference ID:</span> <span className="text-white">{depositSuccessData.id}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span> <span className="text-amber-400 font-semibold">Pending Approval</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Email Notice:</span> <span className="text-emerald-400">Dispatched</span>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={resetModals}
                    className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* QR Code & Address Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  {qrCodeUrl ? (
                    <div className="p-2 bg-white rounded-lg shrink-0 shadow-md">
                      <img
                        src={qrCodeUrl}
                        alt={`${selectedAsset} Deposit QR`}
                        className="w-32 h-32 block"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-slate-900 border border-slate-800 animate-pulse" />
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Network:</span>
                      <span className="font-semibold text-slate-200">
                        {currentAddressConfig.chainName} ({currentAddressConfig.networkType})
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">Custody Receiving Address:</div>
                      <div className="flex items-center gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-xs font-mono text-amber-300 break-all select-all flex-1">
                          {currentAddressConfig.address}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0"
                          title="Copy address"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 leading-snug">
                      Required confirmations: <span className="font-mono text-slate-300">{currentAddressConfig.confirmationsRequired}</span>. {currentAddressConfig.notes}
                    </div>
                  </div>
                </div>

                {/* Form to submit proof of deposit */}
                <form onSubmit={handleDepositSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Amount Sent ({selectedAsset})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder={`e.g. 1.25 ${selectedAsset}`}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">
                        {selectedAsset}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Blockchain Transaction Hash (TXID / Proof)
                    </label>
                    <input
                      type="text"
                      placeholder="Paste your explorer TXID here (e.g. 0x8f3c... or solscan signature)"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Admin will verify this transaction hash on the blockchain and credit your account automatically.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetModals}
                      className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingDeposit}
                      className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSubmittingDeposit ? 'Verifying...' : 'Submit Deposit Notification'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ---------------- WITHDRAWAL TAB ---------------- */}
        {mode === 'withdraw' && (
          <div>
            {withdrawSuccessData ? (
              <div className="py-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Withdrawal Queued for Multi-Sig Signing</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Your withdrawal request for <strong className="text-amber-400">{withdrawSuccessData.amount} {withdrawSuccessData.assetId}</strong> has been submitted. The security administrator desk has been dispatched an automated email.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-left text-xs space-y-1.5 max-w-sm mx-auto font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Ticket ID:</span> <span className="text-white">{withdrawSuccessData.id}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Destination:</span> <span className="text-slate-300 truncate max-w-[170px]">{withdrawSuccessData.toAddress}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span> <span className="text-amber-400 font-semibold">Pending Authorization</span>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={resetModals}
                    className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2">
                {/* Available Balance Box */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Available to Withdraw:</span>
                    <div className="text-sm font-bold text-white font-mono">
                      {availableBalance.toFixed(4)} {selectedAsset}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    ≈ ${(availableBalance * assetInfo.priceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Destination {selectedAsset} Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Enter your ${selectedAsset} address on ${assetInfo.network}`}
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ensure destination matches {assetInfo.network}. Cross-chain mismatches may cause asset loss.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Withdrawal Amount
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const maxVal = Math.max(0, availableBalance - withdrawalFee);
                        setWithdrawAmount(maxVal > 0 ? maxVal.toFixed(4) : '0');
                      }}
                      className="text-[10px] font-mono font-semibold text-amber-400 hover:text-amber-300"
                    >
                      MAX AVAILABLE
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">
                      {selectedAsset}
                    </span>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Network Gas Fee:</span>
                    <span>{withdrawalFee} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Required:</span>
                    <span>{(parseFloat(withdrawAmount || '0') + withdrawalFee).toFixed(4)} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold pt-1 border-t border-slate-800">
                    <span>Net Dispatched to Address:</span>
                    <span className="text-emerald-400">{netWithdrawal.toFixed(4)} {selectedAsset}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetModals}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingWithdraw}
                    className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSubmittingWithdraw ? 'Requesting...' : 'Request Secure Withdrawal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
