import React from 'react';
import { ShieldCheck, MessageCircle, Send, Lock } from 'lucide-react';
import { SystemSettings } from '../types/crypto';

interface FooterProps {
  settings?: SystemSettings;
  onOpenSupport: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenSupport }) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-12 px-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand & Mandate */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 text-xs font-black">
              V
            </div>
            <span>VaultStake Protocol</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            Institutional non-custodial and segregated multi-sig cryptocurrency staking infrastructure.
            Automated daily rewards settlement with cryptographic yield proofs across Bitcoin, Ethereum, Solana, and EVM chains.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href={settings?.whatsappUrl || 'https://wa.me/15558492910'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
            <a
              href={settings?.telegramUrl || 'https://t.me/VaultStakeOfficialSupport'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Support</span>
            </a>
          </div>
        </div>

        {/* Protocol Security */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
            Security Architecture
          </h4>
          <ul className="text-xs space-y-2 text-slate-500 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Multi-Signature Cold Storage</span>
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Time-Locked Validator Nodes</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>FIPS 140-2 Level 3 HSM Enclaves</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              <span>Automated Transaction Email Audits</span>
            </li>
          </ul>
        </div>

        {/* Support & Physical Headquarters */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
            Headquarters & Compliance
          </h4>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <span className="text-sm">🇺🇸</span>
              <span>New York Headquarters</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              One World Trade Center, 285 Fulton Street, Suite 7800<br />
              New York, NY 10007, United States
            </p>
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Jurisdiction: New York, USA</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FinCEN MSB</span>
            </div>
          </div>
          <button
            onClick={onOpenSupport}
            className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs text-slate-800 dark:text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Open 24/7 Support Desk
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div>
          © {new Date().getFullYear()} VaultStake Institutional Technologies Inc. (New York, United States). All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer">New York Regulatory Filing</span>
          <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer">Custody Terms</span>
          <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer">Validator SLA</span>
        </div>
      </div>
    </footer>
  );
};
