export type Verdict = 'INVEST' | 'MONITOR' | 'REJECT';

export type DimensionKey =
  | 'verification'
  | 'team'
  | 'market'
  | 'competition'
  | 'technology'
  | 'financial'
  | 'legal'
  | 'fraud'
  | 'risk';

export interface DimensionAssessment {
  score: number;
  summary: string;
}

export interface FullAssessment {
  verification: DimensionAssessment;
  team: DimensionAssessment;
  market: DimensionAssessment;
  competition: DimensionAssessment;
  technology: DimensionAssessment;
  financial: DimensionAssessment;
  legal: DimensionAssessment;
  fraud: DimensionAssessment;
  risk: DimensionAssessment;
  overall_reasoning: string;
  confidence: number;
}

export interface DiligenceReport {
  rep_key: string;
  score: number;
  verdict: Verdict;
  assessment: FullAssessment;
  reasoning: string;
  confidence: number;
  report_hash: string;
}

export type SubmissionStatus = 'SUBMITTED' | 'RESOLVED';

export interface StartupSubmission {
  rep_key: string;
  name: string;
  website: string;
  sector: string;
  founder: string;
  documents: string[];
  status: SubmissionStatus;
  report: DiligenceReport | null;
}

export interface LocalSubmissionMeta {
  rep_key: string;
  name: string;
  website: string;
  sector: string;
  founder: string;
  timestamp: number;
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  chainIdHex: string;
  rpcUrl: string;
  explorerUrl?: string;
  contractAddress: string;
  deploymentTx: string;
}

export interface ValidationErrors {
  name?: string;
  website?: string;
  sector?: string;
  founder?: string;
  documents?: string;
  general?: string;
}

export type EvaluationStep =
  | 'idle'
  | 'preparing'
  | 'wallet_confirmation'
  | 'tx_submitted'
  | 'waiting_consensus'
  | 'reading_report'
  | 'complete'
  | 'error';

export interface EvaluationState {
  step: EvaluationStep;
  message: string;
  txHash?: string;
  error?: string;
  details?: string;
}
