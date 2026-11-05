import React, { useState } from 'react';
import { MessageCircle, Send, X, Headphones, Check, ExternalLink, MapPin } from 'lucide-react';
import { SystemSettings } from '../types/crypto';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SupportWidgetProps {
  settings?: SystemSettings;
  isOpen?: boolean;
  onClose?: () => void;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ settings, isOpen: forcedOpen, onClose }) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = forcedOpen !== undefined ? forcedOpen : internalOpen;

  const handleClose = () => {
    if (onClose) onClose();
    setInternalOpen(false);
  };

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'deposit' | 'withdrawal' | 'staking' | 'security' | 'other'>('deposit');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) return;

    setIsSubmitting(true);
    try {
      await api.support.submitTicket({
        subject,
        category,
        message,
        userEmail: user?.email || 'guest@vaultstake.io'
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setMessage('');
        setSubject('');
        handleClose();
      }, 2500);
    } catch (err) {
      console.error('Failed to submit ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappPhone = settings?.whatsappNumber || '+1 (555) 849-2910';
  const whatsappUrl =
    settings?.whatsappUrl ||
    `https://wa.me/15558492910?text=${encodeURIComponent(
      `Hello VaultStake Support, I need assistance with account ${user?.email || ''}`
    )}`;

  const telegramHandle = settings?.telegramHandle || '@VaultStakeOfficialSupport';
  const telegramUrl = settings?.telegramUrl || 'https://t.me/VaultStakeOfficialSupport';

  return (
    <>
      {/* Floating Widget Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setInternalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-full shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all hover:scale-105"
          aria-label="Open 24/7 Support Desk"
        >
          <Headphones className="w-5 h-5" />
          <span className="text-xs tracking-wide">Live Support</span>
        </button>
      )}

      {/* Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Institutional Support Desk</h3>
                  <p className="text-xs text-slate-400">24/7 Priority Resolution Channels</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instant Messaging Channels (WhatsApp & Telegram) */}
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-300">
                {settings?.supportGreeting ||
                  'Connect directly with our operations team for real-time deposit confirmations and withdrawal clearance:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WhatsApp Card */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-700/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200">
                        WhatsApp Live Desk
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{whatsappPhone}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400/70 group-hover:text-emerald-300" />
                </a>

                {/* Telegram Card */}
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3.5 rounded-lg border border-sky-900/40 bg-sky-950/20 hover:bg-sky-950/40 hover:border-sky-700/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-sky-500/20 flex items-center justify-center text-sky-400">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-sky-300 group-hover:text-sky-200">
                        Telegram Channel
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{telegramHandle}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400/70 group-hover:text-sky-300" />
                </a>
              </div>
            </div>

            {/* In-App Direct Inquiry Form */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Or Submit In-App Support Ticket
              </div>

              {isSubmitted ? (
                <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-emerald-300">Ticket Dispatched to Admin Queue</p>
                  <p className="text-[11px] text-slate-400">
                    A notification has been sent to our desk. You will receive an automated email response shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="deposit">Deposit Verification</option>
                        <option value="withdrawal">Withdrawal Clearance</option>
                        <option value="staking">Staking Pool Inquiry</option>
                        <option value="security">Account Security</option>
                        <option value="other">General Technical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Deposit confirmation TX#4a5"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Details / TXID
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Include transaction hash, chain network, or any questions..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Send Inquiry'}
                    </button>
                  </div>
                </form>
              )}

              {/* Physical Headquarters & Regulatory Jurisdiction */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🇺🇸</span>
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-slate-300 font-mono">
                    {settings?.headquartersAddress || 'One World Trade Center, 285 Fulton Street, Suite 7800, New York, NY 10007, United States'}
                  </span>
                </div>
                <span className="text-emerald-400 font-mono font-semibold shrink-0">
                  FinCEN MSB #31000284729184
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
