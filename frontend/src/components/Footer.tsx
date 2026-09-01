import React from 'react';
import { BRADBURY_CONFIG } from '../services/contract';
import { ShieldCheck } from './icons';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-200 text-sm">Consensus-Backed Due Diligence</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              VentureMind executes evidence assessment across GenLayer validators. Leader and validator must independently evaluate untrusted evidence and reach consensus before reports are finalized.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-300 text-xs uppercase tracking-wider mb-3">
              Bradbury Deployed Infrastructure
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Contract:</span>
                <span className="text-emerald-400 truncate max-w-[200px]">{BRADBURY_CONFIG.contractAddress}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Chain ID:</span>
                <span className="text-slate-200">4221 (0x107d)</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">RPC:</span>
                <span className="text-slate-200 truncate max-w-[200px]">https://rpc-bradbury.genlayer.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-300 text-xs uppercase tracking-wider mb-3">
              Important Due Diligence Notice
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              VentureMind evaluates submitted evidence only. Assessments do not constitute guaranteed investment advice, company legitimacy proofs, or return guarantees.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} VentureMind AI. Powered by GenLayer Intelligent Contracts.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Bradbury Testnet Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
