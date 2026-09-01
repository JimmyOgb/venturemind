import React, { useState } from 'react';
import { contractService } from '../services/contract';
import { Search, X, Loader2, AlertCircle, ArrowRight } from './icons';

interface LookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSubmission: (repKey: string) => void;
  onViewReport: (repKey: string) => void;
}

export const LookupModal: React.FC<LookupModalProps> = ({
  isOpen,
  onClose,
  onSelectSubmission,
  onViewReport,
}) => {
  const [repKeyInput, setRepKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = repKeyInput.trim();
    if (!cleanKey) {
      setError('Please enter a rep_key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sub = await contractService.getSubmission(cleanKey);
      if (!sub) {
        setError('No submission found with this rep_key on the Bradbury network.');
        setLoading(false);
        return;
      }

      onClose();
      if (sub.status === 'RESOLVED') {
        onViewReport(cleanKey);
      } else {
        onSelectSubmission(cleanKey);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Search className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Lookup On-Chain Submission</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Enter the 64-character SHA-256 <span className="font-mono text-emerald-400">rep_key</span> to query contract state directly.
        </p>

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              rep_key
            </label>
            <input
              type="text"
              value={repKeyInput}
              onChange={(e) => setRepKeyInput(e.target.value)}
              placeholder="e.g. 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Querying Contract...</span>
                </>
              ) : (
                <>
                  <span>Fetch Record</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
