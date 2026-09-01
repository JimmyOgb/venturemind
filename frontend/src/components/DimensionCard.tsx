import React from 'react';
import { DimensionAssessment, DimensionKey } from '../types/contract';
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from '../services/calldata';
import { ShieldCheck, Users, TrendingUp, Target, Cpu, DollarSign, Scale, AlertOctagon, ShieldAlert } from './icons';

interface DimensionCardProps {
  dimensionKey: DimensionKey;
  assessment: DimensionAssessment;
}

const DIMENSION_ICONS: Record<DimensionKey, React.ComponentType<{ className?: string }>> = {
  verification: ShieldCheck,
  team: Users,
  market: TrendingUp,
  competition: Target,
  technology: Cpu,
  financial: DollarSign,
  legal: Scale,
  fraud: AlertOctagon,
  risk: ShieldAlert,
};

export const DimensionCard: React.FC<DimensionCardProps> = ({ dimensionKey, assessment }) => {
  const meta = DIMENSION_LABELS[dimensionKey];
  const weight = DIMENSION_WEIGHTS[dimensionKey];
  const Icon = DIMENSION_ICONS[dimensionKey] || Target;

  const isFraud = dimensionKey === 'fraud';
  const score = assessment.score;

  let scoreColorClass = 'text-emerald-400';
  let barColorClass = 'bg-emerald-500';

  if (isFraud) {
    if (score >= 50) {
      scoreColorClass = 'text-rose-400';
      barColorClass = 'bg-rose-500';
    } else if (score >= 25) {
      scoreColorClass = 'text-amber-400';
      barColorClass = 'bg-amber-500';
    } else {
      scoreColorClass = 'text-emerald-400';
      barColorClass = 'bg-emerald-500';
    }
  } else {
    if (score >= 75) {
      scoreColorClass = 'text-emerald-400';
      barColorClass = 'bg-emerald-500';
    } else if (score >= 45) {
      scoreColorClass = 'text-amber-400';
      barColorClass = 'bg-amber-500';
    } else {
      scoreColorClass = 'text-rose-400';
      barColorClass = 'bg-rose-500';
    }
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 hover:border-slate-700 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 leading-snug">{meta.name}</h4>
              <span className="text-[11px] font-mono text-slate-400">Weight: {weight}%</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xl font-bold font-mono ${scoreColorClass}`}>{score}</span>
            <span className="text-xs text-slate-500 font-mono">/100</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
            style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
          />
        </div>

        {/* Dimension Summary */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
          {assessment.summary || 'No summary provided.'}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate pr-2">{meta.description}</span>
        {isFraud && <span className="text-rose-400/80 font-mono shrink-0">Inverted in total</span>}
      </div>
    </div>
  );
};
