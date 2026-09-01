import React from 'react';
import { EvaluationState } from '../types/contract';
import { Loader2, CheckCircle2, AlertCircle, Cpu, ShieldCheck, RefreshCw, X } from './icons';

interface EvaluationModalProps {
  state: EvaluationState;
  onClose: () => void;
  onRetry?: () => void;
  onViewReport?: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  state,
  onClose,
  onRetry,
  onViewReport,
}) => {
  const steps = [
    { id: 'preparing', label: 'Preparing evaluation payload' },
    { id: 'wallet_confirmation', label: 'Waiting for wallet confirmation' },
    { id: 'tx_submitted', label: 'Evaluation transaction submitted' },
    { id: 'waiting_consensus', label: 'Waiting for GenLayer consensus (Leader & Validator)' },
    { id: 'reading_report', label: 'Reading finalized canonical report' },
    { id: 'complete', label: 'Evaluation complete' },
  ];

  const getStepIndex = (currentStep: string) => {
    switch (currentStep) {
      case 'preparing':
        return 0;
      case 'wallet_confirmation':
        return 1;
      case 'tx_submitted':
        return 2;
      case 'waiting_consensus':
        return 3;
      case 'reading_report':
        return 4;
      case 'complete':
        return 5;
      default:
        return -1;
    }
  };

  const activeIndex = getStepIndex(state.step);
  const isError = state.step === 'error';
  const isComplete = state.step === 'complete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Consensus Due Diligence</h3>
              <p className="text-xs text-slate-400">VentureMindAI Intelligent Contract</p>
            </div>
          </div>

          {(isError || isComplete) && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step Progress Tracker */}
        <div className="space-y-3 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {steps.map((s, idx) => {
            const isDone = activeIndex > idx || isComplete;
            const isCurrent = activeIndex === idx && !isError;
            const isFailed = isError && activeIndex === idx;

            return (
              <div key={s.id} className="flex items-center gap-3 text-xs">
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  ) : isFailed ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-[9px] text-slate-500">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <span
                  className={`${
                    isDone
                      ? 'text-slate-300'
                      : isCurrent
                      ? 'text-emerald-400 font-semibold'
                      : isFailed
                      ? 'text-rose-400 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status Message / Error info */}
        {isError ? (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
            <div className="flex items-start gap-2.5 text-rose-300 font-medium mb-1">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{state.message || 'Evaluation encountered an error.'}</span>
            </div>
            {state.details && (
              <p className="text-[11px] text-rose-400/80 mt-2 font-mono bg-slate-950 p-2 rounded border border-rose-500/20 whitespace-pre-wrap">
                {state.details}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              Evaluation did not reach consensus. Your submission remains available for another attempt.
            </p>
          </div>
        ) : (
          <div className="mb-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
            {!isComplete && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />}
            {isComplete && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{state.message}</span>
          </div>
        )}

        {/* Transaction hash reference if available */}
        {state.txHash && (
          <div className="mb-6 text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-500">Tx Hash:</span>
            <span className="text-slate-300 truncate max-w-[240px]">{state.txHash}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          {isError && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          )}

          {isComplete && onViewReport && (
            <button
              type="button"
              onClick={onViewReport}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              View Diligence Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
