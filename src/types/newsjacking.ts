export interface Keyword {
  term: string;
  weight: number;
  category: 'industry' | 'values' | 'products' | 'competitors';
  userPreference: number;
  isActive: boolean;
}

export interface ArticleOpportunity {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: number;
  keywords: string[];
  baseScore: number;
  dynamicScore: number;
  trendingScore: number;
  isTrending: boolean;
  aiBrief?: {
    title: string;
    brief: string;
    emotion: string;
    generatedAt: number;
  } | null;
}

export interface BrandGuideProcessing {
  content: string;
  extractedKeywords: Keyword[];
}

export interface OpportunityFilters {
  category?: Keyword['category'];
  minScore?: number;
  isTrending?: boolean;
}