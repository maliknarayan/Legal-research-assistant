// View shapes shared between the workspace page (DB seed) and the step components
// (API results). Kept flat and serialisable.

export interface LawView {
  act: string;
  section: string;
  explanation: string;
  reason: string;
  verified: boolean;
  quote: string;
  sourceUrl: string;
}

export interface PrecedentView {
  caseName: string;
  court: string;
  citation: string;
  year: string;
  legalPrinciple: string;
  relevance: string;
  similarityScore: number;
  verificationStatus: string;
  sourceUrl: string;
  quote: string;
}

export interface AnalysisView {
  issues: string;
  applicableLaw: string;
  strengths: string;
  weaknesses: string;
  missingFacts: string;
}

export interface ArgumentEntry {
  content: string;
  supportingLaw: string;
  sourcePassageId: string;
}

export interface ArgumentsView {
  applicant: ArgumentEntry[];
  counter: ArgumentEntry[];
}

export interface RecommendationView {
  action: string;
  reason: string;
  priority: number;
}
