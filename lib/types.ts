export interface Scientist {
  id: string;
  name: string;
  title: string;
  institution: string;
  orcid?: string;
  avatarUrl: string;
  solanaAddress: string;
}

export interface ResearchCampaign {
  id: string;
  title: string;
  medicalProblem: string;
  unresolvedBarrier: string;
  proposedSolution: string;
  category: 'oncology' | 'neurology' | 'genetics' | 'infectious' | 'rare_diseases';
  scientist: Scientist;
  targetAmount: number; // in USD
  raisedAmount: number; // in USD
  targetSol: number; // in SOL
  raisedSol: number; // in SOL
  donorCount: number;
  daysRemaining: number;
  stage: string;
  budgetBreakdown: {
    item: string;
    percentage: number;
    amount: number;
    amountSol: number;
  }[];
  recentDonations?: {
    id: string;
    donorName: string;
    amountSol: number;
    amountUsd: number;
    timestamp: string;
    message?: string;
    signature?: string;
  }[];
  isUserCreated?: boolean;
}

export type CategoryFilter = 'all' | 'oncology' | 'neurology' | 'genetics' | 'infectious' | 'rare_diseases';

export interface BlockchainRecord {
  id: string;
  text: string;
  timestamp: string;
  txSignature: string;
  explorerUrl: string;
}
