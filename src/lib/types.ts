export type SourceType = "playstore" | "appstore" | "reddit";

export type RawFeedbackItem = {
  id: string;
  source: SourceType;
  app: string;
  author?: string;
  rating?: number;
  title?: string;
  text: string;
  date?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export type BlockerType =
  | "habit_autopilot"
  | "search_tunnel"
  | "trust_quality"
  | "price_uncertainty"
  | "assortment_gap"
  | "discovery_ui"
  | "first_purchase_risk"
  | "time_pressure"
  | "none"
  | "other";

export type DiscoveryMode =
  | "search"
  | "reorder"
  | "browse"
  | "recommendation"
  | "ad_promo"
  | "external"
  | "unknown";

export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

export type ClassifiedItem = RawFeedbackItem & {
  sentiment: Sentiment;
  categoriesMentioned: string[];
  blockerType: BlockerType;
  discoveryMode: DiscoveryMode;
  userSegmentSignals: string[];
  isExplorationRelated: boolean;
  summary: string;
  language: string;
  substantive: boolean;
};

export type Theme = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  sources: SourceType[];
  confidence: "high" | "medium" | "low";
  sampleIds: string[];
  keywords: string[];
};

export type Insight = {
  id: string;
  question: string;
  answer: string;
  evidenceIds: string[];
  themes: string[];
  confidence: "high" | "medium" | "low";
};

export type ValidationReport = {
  goldSetSize: number;
  accuracy: number;
  cohenKappa: number;
  themeStability: number;
  negativeControlPass: boolean;
  citationCoverage: number;
  singleSourceThemes: string[];
  notes: string[];
};

export type CorpusStats = {
  totalRaw: number;
  substantive: number;
  bySource: Record<string, number>;
  byApp: Record<string, number>;
  dateRange: { from?: string; to?: string };
};

export type PipelineOutput = {
  generatedAt: string;
  model: string;
  stats: CorpusStats;
  items: ClassifiedItem[];
  themes: Theme[];
  insights: Insight[];
  validation?: ValidationReport;
};
