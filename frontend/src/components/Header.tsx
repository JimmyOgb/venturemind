import React, { useState } from 'react';
import { BRADBURY_CONFIG } from '../services/contract';
import { formatAddress, switchToBradburyNetwork } from '../services/wallet';
import { WalletState } from '../services/wallet';
import {
  Wallet,
  ExternalLink,
  Copy,
  Check,
  Search,
  Layers,
  AlertCircle,
} from './icons';

interface HeaderProps {
  wallet: WalletState;
  onConnectWallet: () => void;
  currentTab: 'home' | 'submit' | 'evaluations' | 'submission_detail' | 'report';
  onNavigate: (tab: 'home' | 'submit' | 'evaluations') => void;
  onOpenLookup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wallet,
  onConnectWallet,
  currentTab,
  onNavigate,
  onOpenLookup,
}) => {
  const [copied, setCopied] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  const handleCopyContract = () => {
    navigator.clipboard.writeText(BRADBURY_CONFIG.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      await switchToBradburyNetwork();
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      alert(err);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  VentureMind
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI Oracle
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">GenLayer Due Diligence</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTab === 'home'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('submit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTab === 'submit'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Submit Startup
            </button>
            <button
              onClick={() => onNavigate('evaluations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTab === 'evaluations'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              My Evaluations
            </button>
          </nav>
        </div>

        {/* Right side controls: Contract status, Explorer search, Network badge, Wallet */}
        <div className="flex items-center gap-3">
          {/* Quick Lookup Button */}
          <button
            onClick={onOpenLookup}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
            title="Lookup submission by rep_key"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search rep_key</span>
          </button>

          {/* Network Indicator */}
          {wallet.isConnected && !wallet.isBradbury ? (
            <button
              onClick={handleSwitchNetwork}
              disabled={switchingNetwork}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-medium transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
              <span>Switch to Bradbury</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">{BRADBURY_CONFIG.name}</span>
              <span className="text-slate-400 text-[11px] font-mono">({BRADBURY_CONFIG.chainId})</span>
            </div>
          )}

          {/* Deployed Contract Pill */}
          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Contract:</span>
            <span className="text-emerald-400">{formatAddress(BRADBURY_CONFIG.contractAddress)}</span>
            <button
              onClick={handleCopyContract}
              className="p-1 hover:text-white text-slate-400 transition-colors"
              title="Copy Contract Address"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <a
              href={`${BRADBURY_CONFIG.explorerUrl}/address/${BRADBURY_CONFIG.contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-white text-slate-400 transition-colors"
              title="View on Bradbury Explorer"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Wallet Button */}
          {wallet.isConnected && wallet.address ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{formatAddress(wallet.address)}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
