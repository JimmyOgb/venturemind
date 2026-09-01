import React from 'react';
import { SubmissionStatus, Verdict } from '../types/contract';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Sparkles } from './icons';

interface StatusBadgeProps {
  status?: SubmissionStatus;
  verdict?: Verdict;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, verdict, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-4 py-1.5 text-sm font-bold',
  }[size];

  if (verdict) {
    switch (verdict) {
      case 'INVEST':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            INVEST
          </span>
        );
      case 'MONITOR':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            MONITOR
          </span>
        );
      case 'REJECT':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            REJECT
          </span>
        );
    }
  }

  if (status) {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 ${sizeClasses}`}
          >
            <Clock className="w-3.5 h-3.5" />
            SUBMITTED
          </span>
        );
      case 'RESOLVED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 ${sizeClasses}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            RESOLVED
          </span>
        );
    }
  }

  return null;
};
