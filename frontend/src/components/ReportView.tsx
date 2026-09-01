import React, { useState, useEffect } from 'react';
import { DiligenceReport, DimensionKey, StartupSubmission } from '../types/contract';
import { contractService, BRADBURY_CONFIG } from '../services/contract';
import { StatusBadge } from './StatusBadge';
import { DimensionCard } from './DimensionCard';
import {
  ShieldCheck,
  BarChart3,
  FileCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Info,
  ArrowLeft,
  Cpu,
} from './icons';

interface ReportViewProps {
  repKey: string;
  onBack: () => void;
}

const ALL_DIMENSIONS: DimensionKey[] = [
  'verification',
  'team',
  'market',
  'competition',
  'technology',
  'financial',
  'legal',
  'fraud',
  'risk',
];

export const ReportView: React.FC<ReportViewProps> = ({ repKey, onBack }) => {
  const [report, setReport] = useState<DiligenceReport | null>(null);
  const [submission, setSubmission] = useState<StartupSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [rep, sub] = await Promise.all([
          contractService.getReport(repKey),
          contractService.getSubmission(repKey),
        ]);
        if (mounted) {
          if (!rep) {
            setError('Diligence report not found. The submission may still be awaiting evaluation.');
          } else {
            setReport(rep);
          }
          if (sub) {
            setSubmission(sub);
          }
        }
      } catch (e: unknown) {
        if (mounted) {
          const err = e instanceof Error ? e.message : String(e);
          setError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [repKey]);

  const handleCopy = (text: string, type: 'hash' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-mono">Retrieving finalized consensus report from contract...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-2">Report Not Found</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {error || 'No finalized report exists for this rep_key.'}
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const score = report.score;
  const verdict = report.verdict;

  const verdictColor =
    verdict === 'INVEST'
      ? 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30'
      : verdict === 'MONITOR'
      ? 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30'
      : 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30';

  const scoreRingColor =
    verdict === 'INVEST'
      ? 'text-emerald-400'
      : verdict === 'MONITOR'
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Evaluations</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Status:</span>
          <StatusBadge status="RESOLVED" />
        </div>
      </div>

      {/* Main Report Header & Executive Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md mb-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Canonical Consensus Assessment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              {submission?.name || 'Startup Due Diligence Report'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
              {submission?.sector && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                  {submission.sector}
                </span>
              )}
              {submission?.website && (
                <a
                  href={submission.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>{submission.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="font-semibold text-white block mb-1">Executive Diligence Reasoning:</span>
              {report.reasoning || report.assessment.overall_reasoning || 'No overall reasoning text provided.'}
            </p>
          </div>

          {/* Overall Score & Verdict Big Badge */}
          <div className={`p-6 rounded-2xl bg-gradient-to-b border ${verdictColor} flex flex-col items-center justify-center text-center shrink-0 min-w-[240px]`}>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
              Overall Consensus Score
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span className={`text-5xl sm:text-6xl font-extrabold font-mono tracking-tight ${scoreRingColor}`}>
                {score}
              </span>
              <span className="text-sm font-mono text-slate-500">/100</span>
            </div>

            <div className="mt-3">
              <StatusBadge verdict={verdict} size="lg" />
            </div>

            {/* Confidence Metric */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 w-full text-center">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Confidence:</span>
                <span className="text-slate-200 font-bold">{report.confidence}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${Math.min(report.confidence, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Callout */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            VentureMind evaluates submitted evidence through GenLayer leader/validator consensus. Confidence reflects confidence in the evidence assessment, not certainty about the startup's future. This is not guaranteed investment advice or proof of founder identity.
          </p>
        </div>
      </div>

      {/* Nine Diligence Dimensions Grid */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Nine Diligence Dimensions</span>
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated independently by GenLayer validators with ±10 dimensional score tolerance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_DIMENSIONS.map((dimKey) => {
            const dimAssessment = report.assessment[dimKey] || { score: 0, summary: 'N/A' };
            return (
              <DimensionCard
                key={dimKey}
                dimensionKey={dimKey}
                assessment={dimAssessment}
              />
            );
          })}
        </div>
      </div>

      {/* Report Integrity & On-chain Verification Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            On-Chain Integrity & Cryptographic Commitments
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Report SHA-256 Hash Commitment:</span>
            <div className="flex items-center justify-between gap-2 text-slate-200">
              <span className="truncate">{report.report_hash}</span>
              <button
                onClick={() => handleCopy(report.report_hash, 'hash')}
                className="p-1 hover:text-emerald-400 text-slate-400 shrink-0"
                title="Copy Report Hash"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Canonical rep_key:</span>
            <div className="flex items-center justify-between gap-2 text-slate-200">
              <span className="truncate">{report.rep_key}</span>
              <button
                onClick={() => handleCopy(report.rep_key, 'key')}
                className="p-1 hover:text-emerald-400 text-slate-400 shrink-0"
                title="Copy rep_key"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Contract Address:</span>
            <div className="flex items-center justify-between gap-2 text-slate-200">
              <span className="truncate">{BRADBURY_CONFIG.contractAddress}</span>
              <a
                href={`${BRADBURY_CONFIG.explorerUrl}/address/${BRADBURY_CONFIG.contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 hover:text-emerald-400 text-slate-400 shrink-0"
                title="View on Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Network & Consensus:</span>
            <div className="flex items-center justify-between gap-2 text-slate-200">
              <span>{BRADBURY_CONFIG.name} (Chain ID 4221)</span>
              <span className="text-emerald-400">Finalized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Assessment Collapsible */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden mb-8">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              View Raw Assessment JSON
            </span>
          </div>
          {showRawJson ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showRawJson && (
          <div className="p-6 bg-slate-950 border-t border-slate-800 overflow-x-auto">
            <pre className="text-xs font-mono text-emerald-400/90 whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
