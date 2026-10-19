// Shared domain types for the legal research workflow.
// These mirror the structured outputs produced by each AI prompt module.

export type ResearchStatus = "draft" | "in_progress" | "complete";

export type VerificationStatus = "verified" | "unverified";

export type ArgumentSide = "applicant" | "counter";

// Step 1 — user-entered case facts.
export interface CaseFactsInput {
  facts: string;
  timeline: string;
  parties: string;
  reliefSought: string;
}

// Step 2 — a single applicable law / section.
export interface ApplicableLaw {
  act: string;
  section: string;
  explanation: string;
  reason: string;
  verified: boolean;
}

// Step 3 — a reference judgment. Never presented as fact unless verified.
export interface PrecedentResult {
  caseName: string;
  court: string;
  citation: string;
  year: string;
  legalPrinciple: string;
  relevance: string;
  similarityScore: number;
  verificationStatus: VerificationStatus;
  sourceUrl: string;
}

// Step 4 — structured legal analysis (markdown per section).
export interface LegalAnalysis {
  issues: string;
  applicableLaw: string;
  strengths: string;
  weaknesses: string;
  missingFacts: string;
}

// Step 5 — a single argument, ideally backed by law.
export interface LegalArgument {
  side: ArgumentSide;
  content: string;
  supportingLaw: string;
}

// Step 6 — a recommended procedural next step.
export interface NextStepRecommendation {
  action: string;
  reason: string;
  priority: number;
}

// Every workflow step. Used to key streaming state and section rendering.
export type WorkflowStep =
  | "laws"
  | "precedents"
  | "analysis"
  | "arguments"
  | "recommendations";
