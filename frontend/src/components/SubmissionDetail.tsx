import React, { useState, useEffect } from 'react';
import { StartupSubmission, EvaluationState } from '../types/contract';
import { contractService } from '../services/contract';
import { WalletState, formatAddress, switchToBradburyNetwork } from '../services/wallet';
import { StatusBadge } from './StatusBadge';
import { EvaluationModal } from './EvaluationModal';
import {
  Globe,
  User,
  Layers,
  FileText,
  Play,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from './icons';

interface SubmissionDetailProps {
  repKey: string;
  wallet: WalletState;
  onConnectWallet: () => void;
  onViewReport: (repKey: string) => void;
  onBack: () => void;
}

export const SubmissionDetail: React.FC<SubmissionDetailProps> = ({
  repKey,
  wallet,
  onConnectWallet,
  onViewReport,
  onBack,
}) => {
  const [submission, setSubmission] = useState<StartupSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Evaluation modal state
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalState, setEvalState] = useState<EvaluationState>({
    step: 'idle',
    message: '',
  });

  const fetchSubmission = async () => {
    setLoading(true);
    setError(null);
    try {
      const sub = await contractService.getSubmission(repKey);
      if (!sub) {
        setError('Submission not found on Bradbury network.');
      } else {
        setSubmission(sub);
        if (sub.status === 'RESOLVED') {
          onViewReport(repKey);
        }
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [repKey]);

  const handleCopyRepKey = () => {
    navigator.clipboard.writeText(repKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleStartEvaluation = async () => {
    if (!wallet.isConnected) {
      onConnectWallet();
      return;
    }

    if (!wallet.isBradbury) {
      try {
        await switchToBradburyNetwork();
      } catch (e: unknown) {
        const err = e instanceof Error ? e.message : String(e);
        alert(err);
        return;
      }
    }

    // Verify connected wallet is founder
    const normalizedSender = wallet.address?.trim().toLowerCase();
    const normalizedFounder = submission?.founder.trim().toLowerCase();
    if (normalizedSender !== normalizedFounder) {
      alert('Only the submitting founder wallet can initiate evaluation for this startup.');
      return;
    }

    setShowEvalModal(true);
    setEvalState({
      step: 'preparing',
      message: 'Preparing consensus evaluation transaction...',
    });

    try {
      setEvalState({
        step: 'wallet_confirmation',
        message: 'Please confirm the evaluate_startup transaction in your wallet...',
      });

      const { txHash } = await contractService.evaluateStartup(repKey, wallet.address!);

      setEvalState({
        step: 'waiting_consensus',
        message: 'GenLayer validators are independently assessing evidence and validating consensus...',
        txHash,
      });

      // Poll for final report on-chain
      await contractService.pollForReport(repKey);

      setEvalState({
        step: 'complete',
        message: 'Evaluation finalized and persisted by GenLayer consensus!',
        txHash,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setEvalState({
        step: 'error',
        message: 'Evaluation did not complete.',
        details: errorMsg,
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-mono">Reading submission state from Bradbury contract...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-2">Submission Not Found</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {error || 'No submission was found with the specified rep_key on the Bradbury network.'}
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isFounder =
    wallet.isConnected &&
    wallet.address?.trim().toLowerCase() === submission.founder.trim().toLowerCase();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{submission.name}</h2>
            <StatusBadge status={submission.status} />
          </div>
          <p className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>rep_key:</span>
            <span className="text-slate-300 truncate max-w-[200px] sm:max-w-[320px]">{repKey}</span>
            <button
              onClick={handleCopyRepKey}
              className="p-1 hover:text-emerald-400 text-slate-400"
              title="Copy rep_key"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            Back
          </button>

          {submission.status === 'SUBMITTED' ? (
            <button
              onClick={handleStartEvaluation}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Evaluate Startup</span>
            </button>
          ) : (
            <button
              onClick={() => onViewReport(repKey)}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <span>View Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Evaluation Readiness:</span> Evaluation runs a consensus-backed AI assessment through the VentureMindAI Intelligent Contract on Bradbury.
          {!isFounder && wallet.isConnected && (
            <p className="text-amber-400 mt-1">
              Note: You are currently connected with a wallet that does not match this startup's registered founder address ({formatAddress(submission.founder)}). Only the registered founder can initiate evaluation.
            </p>
          )}
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sector</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{submission.sector}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Website</span>
          </div>
          <a
            href={submission.website}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-emerald-400 hover:underline flex items-center gap-1 font-mono truncate"
          >
            <span className="truncate">{submission.website}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Founder Address</span>
          </div>
          <p className="text-sm font-mono text-slate-200 truncate">{submission.founder}</p>
        </div>
      </div>

      {/* Evidence Documents Preview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Submitted Evidence ({submission.documents.length} Documents)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total: {submission.documents.reduce((a, b) => a + b.length, 0).toLocaleString()} characters
          </span>
        </div>

        <div className="space-y-4">
          {submission.documents.map((doc, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>Document #{idx + 1}</span>
                <span>{doc.length.toLocaleString()} chars</span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {doc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Modal */}
      {showEvalModal && (
        <EvaluationModal
          state={evalState}
          onClose={() => setShowEvalModal(false)}
          onRetry={handleStartEvaluation}
          onViewReport={() => onViewReport(repKey)}
        />
      )}
    </div>
  );
};
