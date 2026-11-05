import React, { useState } from 'react';
import { Mail, Clock, ShieldCheck, CheckCircle2, ChevronRight, X, Sparkles, Inbox } from 'lucide-react';
import { EmailNotification } from '../types/crypto';

interface EmailNotificationViewerProps {
  emails: EmailNotification[];
  onRefresh?: () => void;
}

export const EmailNotificationViewer: React.FC<EmailNotificationViewerProps> = ({ emails, onRefresh }) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'deposit_approved':
      case 'withdrawal_completed':
        return { label: 'Confirmed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'deposit_received':
      case 'withdrawal_requested':
        return { label: 'In Progress', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'deposit_rejected':
      case 'withdrawal_rejected':
        return { label: 'Security Review', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'stake_created':
        return { label: 'Yield Contract', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'reward_claimed':
        return { label: 'Payout Claimed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      default:
        return { label: 'Protocol Notice', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Automated Transaction Dispatches</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Audit Outbox
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time delivery log of cryptographic transaction receipts, security warnings, and staking payouts dispatched to your registered address.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap self-start"
          >
            Refresh Outbox
          </button>
        )}
      </div>

      {emails.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-slate-800 bg-slate-900/50">
          <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Emails Dispatched Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            When you deposit, withdraw, or stake, cryptographic email receipts will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => {
            const badge = getEventBadge(email.eventType);
            return (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className="group p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {email.subject}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-2xl">
                      {email.previewText}
                    </p>
                    <div className="text-[11px] text-slate-500 font-mono">
                      To: <span className="text-slate-400">{email.toEmail}</span> · ID: {email.id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(email.sentAt).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Email Body Inspector Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 my-8 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Delivered Dispatch
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedEmail.subject}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Recipient: <span className="text-amber-400">{selectedEmail.toEmail}</span> · Dispatched:{' '}
                  {new Date(selectedEmail.sentAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Preview Container */}
            <div className="py-6 max-h-[60vh] overflow-y-auto">
              <div
                className="rounded-lg overflow-hidden border border-slate-800 shadow-inner"
                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">VaultStake Automated Message Protocol · End-to-End Verified</span>
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
