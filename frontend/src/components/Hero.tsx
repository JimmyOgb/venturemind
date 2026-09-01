import React, { useEffect, useState } from 'react';
import { BRADBURY_CONFIG, contractService } from '../services/contract';
import { WalletState } from '../services/wallet';
import {
  ArrowRight,
  Database,
  Sparkles,
  Copy,
  Check,
  Users,
} from './icons';

interface HeroProps {
  wallet: WalletState;
  onConnectWallet: () => void;
  onNavigate: (tab: 'submit' | 'evaluations') => void;
}

export const Hero: React.FC<HeroProps> = ({
  wallet,
  onConnectWallet,
  onNavigate,
}) => {
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const [adminAddress, setAdminAddress] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const [count, admin] = await Promise.all([
          contractService.getSubmissionCount().catch(() => null),
          contractService.getAdmin().catch(() => null),
        ]);
        if (mounted) {
          if (count !== null) setSubmissionCount(count);
          if (admin !== null) setAdminAddress(admin);
        }
      } finally {
        if (mounted) setLoadingStats(false);
      }
    }
    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden py-12 lg:py-20">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GenLayer Bradbury Testnet • Intelligent Contract</span>
          </div>

          {/* Hero Titles */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
            VentureMind
          </h1>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-emerald-400 mb-6">
            AI Startup Due Diligence, Backed by GenLayer Consensus
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
            Submit startup evidence and receive a consensus-backed assessment from a GenLayer Intelligent Contract.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <button
              onClick={() => onNavigate('submit')}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              <span>Evaluate a Startup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('evaluations')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold text-sm transition-all active:scale-95"
            >
              <span>My Evaluations</span>
            </button>
          </div>
        </div>

        {/* Live Network & Contract Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16">
          {/* Card 1: Network & Deployed Contract */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deployed Contract</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live on Bradbury
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 mb-2">
              <span className="truncate pr-2">{BRADBURY_CONFIG.contractAddress}</span>
              <button
                onClick={() => handleCopy(BRADBURY_CONFIG.contractAddress)}
                className="p-1 hover:text-emerald-400 text-slate-400 shrink-0"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Chain ID: 4221 (0x107d) {adminAddress ? `• Admin: ${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}` : ''}
            </p>
          </div>

          {/* Card 2: On-chain Submissions Stats */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accepted Submissions</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {submissionCount !== null ? submissionCount : loadingStats ? '...' : '0'}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100 max prototype cap</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(((submissionCount || 0) / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Connected Wallet Status */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Wallet Status</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            {wallet.isConnected && wallet.address ? (
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate">{wallet.address}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {wallet.isBradbury ? 'Connected to Bradbury Network' : 'Action Required: Switch to Bradbury'}
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={onConnectWallet}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors mb-2"
                >
                  Connect Wallet to Proceed
                </button>
                <p className="text-[11px] text-slate-400">No private keys handled. Transactions signed on-demand.</p>
              </div>
            )}
          </div>
        </div>

        {/* Due Diligence Process Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              End-to-End Due Diligence Lifecycle
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center mx-auto mb-2.5">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">Connect Wallet</h4>
              <p className="text-[11px] text-slate-400 leading-normal">Connect founder wallet on GenLayer Bradbury testnet.</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center mx-auto mb-2.5">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">Submit Startup</h4>
              <p className="text-[11px] text-slate-400 leading-normal">Provide metadata & up to 5 bounded evidence documents.</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center mx-auto mb-2.5">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">Start Evaluation</h4>
              <p className="text-[11px] text-slate-400 leading-normal">Founder explicitly triggers evaluation consensus transaction.</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center mx-auto mb-2.5">
                4
              </div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">GenLayer Consensus</h4>
              <p className="text-[11px] text-slate-400 leading-normal">Leader and validator independently evaluate and agree on scores.</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center mx-auto mb-2.5">
                5
              </div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">Final Report</h4>
              <p className="text-[11px] text-slate-400 leading-normal">Deterministic score, verdict, 9 dimensions & SHA-256 commitment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
