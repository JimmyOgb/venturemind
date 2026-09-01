import React, { useState, useEffect } from 'react';
import { contractService } from '../services/contract';
import { WalletState } from '../services/wallet';
import { getLocalSubmissions, removeLocalSubmission } from '../services/storage';
import { StatusBadge } from './StatusBadge';
import {
  FileText,
  Search,
  Plus,
  Play,
  ArrowRight,
  Trash2,
  RefreshCw,
  Sparkles,
} from './icons';

interface EvaluationsListProps {
  wallet: WalletState;
  onConnectWallet: () => void;
  onNavigateSubmit: () => void;
  onSelectSubmission: (repKey: string) => void;
  onViewReport: (repKey: string) => void;
  onOpenLookup: () => void;
}

interface EnrichedSubmissionItem {
  repKey: string;
  name: string;
  website: string;
  sector: string;
  founder: string;
  status: 'SUBMITTED' | 'RESOLVED' | 'NOT_FOUND' | 'LOADING';
  score?: number;
  verdict?: 'INVEST' | 'MONITOR' | 'REJECT';
  timestamp?: number;
}

export const EvaluationsList: React.FC<EvaluationsListProps> = ({
  wallet,
  onConnectWallet,
  onNavigateSubmit,
  onSelectSubmission,
  onViewReport,
  onOpenLookup,
}) => {
  const [items, setItems] = useState<EnrichedSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadSubmissions = async () => {
    if (!wallet.isConnected || !wallet.address) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const localMetas = getLocalSubmissions(wallet.address);

    const enriched: EnrichedSubmissionItem[] = await Promise.all(
      localMetas.map(async (meta) => {
        try {
          const sub = await contractService.getSubmission(meta.rep_key);
          if (!sub) {
            return {
              repKey: meta.rep_key,
              name: meta.name,
              website: meta.website,
              sector: meta.sector,
              founder: meta.founder,
              status: 'NOT_FOUND',
              timestamp: meta.timestamp,
            };
          }

          let score: number | undefined;
          let verdict: 'INVEST' | 'MONITOR' | 'REJECT' | undefined;

          if (sub.status === 'RESOLVED') {
            const rep = await contractService.getReport(meta.rep_key);
            if (rep) {
              score = rep.score;
              verdict = rep.verdict;
            }
          }

          return {
            repKey: meta.rep_key,
            name: sub.name || meta.name,
            website: sub.website || meta.website,
            sector: sub.sector || meta.sector,
            founder: sub.founder || meta.founder,
            status: sub.status,
            score,
            verdict,
            timestamp: meta.timestamp,
          };
        } catch {
          return {
            repKey: meta.rep_key,
            name: meta.name,
            website: meta.website,
            sector: meta.sector,
            founder: meta.founder,
            status: 'SUBMITTED',
            timestamp: meta.timestamp,
          };
        }
      })
    );

    setItems(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadSubmissions();
  }, [wallet.address, wallet.isConnected]);

  const handleRemove = (e: React.MouseEvent, repKey: string) => {
    e.stopPropagation();
    if (wallet.address && confirm('Remove this startup from your local list? On-chain record remains.')) {
      removeLocalSubmission(wallet.address, repKey);
      setItems((prev) => prev.filter((i) => i.repKey !== repKey));
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.repKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.website.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!wallet.isConnected) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Connect Your Founder Wallet</h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
            Connect your wallet to view your submitted startups, evaluate pending evidence, and access finalized due diligence reports.
          </p>
          <button
            onClick={onConnectWallet}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Founder Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">My Evaluations</h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenLookup}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Query rep_key</span>
          </button>

          <button
            onClick={onNavigateSubmit}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Startup</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Refresh */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter evaluations by name, sector, website, or rep_key..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={loadSubmissions}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Refresh from contract"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* List / Empty State */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-400 font-mono">Querying Bradbury contract records...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No evaluations yet.</h3>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
            {searchTerm
              ? 'No evaluations matched your search criteria.'
              : 'Submit startup evidence to run your first consensus-backed due diligence assessment.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onNavigateSubmit}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              Submit Your First Startup
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.repKey}
              onClick={() => {
                if (item.status === 'RESOLVED') {
                  onViewReport(item.repKey);
                } else {
                  onSelectSubmission(item.repKey);
                }
              }}
              className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {item.name}
                  </h3>
                  {item.status === 'RESOLVED' && item.verdict ? (
                    <StatusBadge verdict={item.verdict} size="sm" />
                  ) : (
                    <StatusBadge status="SUBMITTED" size="sm" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-950 font-medium text-slate-300">
                    {item.sector}
                  </span>
                  <span className="truncate max-w-[200px] font-mono text-slate-400">{item.website}</span>
                  <span className="text-slate-400 font-mono text-[11px] truncate max-w-[150px]">
                    rep_key: {item.repKey.slice(0, 10)}...
                  </span>
                </div>
              </div>

              {/* Action column */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                {item.status === 'RESOLVED' && item.score !== undefined && (
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-mono">Consensus Score</div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      {item.score}
                      <span className="text-xs text-slate-500">/100</span>
                    </div>
                  </div>
                )}

                {item.status === 'SUBMITTED' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSubmission(item.repKey);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Evaluate</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReport(item.repKey);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>View Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={(e) => handleRemove(e, item.repKey)}
                  className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                  title="Remove from local list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
