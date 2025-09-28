import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Keyword, ArticleOpportunity } from '../types/newsjacking';

// Hook for managing keywords
export const useKeywords = () => {
  const keywords = useQuery(api.newsjacking.getKeywords);
  const saveKeywords = useMutation(api.newsjacking.saveKeywords);

  return {
    keywords,
    saveKeywords: async (keywordsData: Keyword[]) => {
      await saveKeywords({ keywords: keywordsData });
    },
    isLoading: keywords === undefined,
  };
};

// Hook for managing opportunities
export const useOpportunities = (includeDismissed = false) => {
  const opportunities = useQuery(api.newsjacking.getOpportunities, { includeDismissed });
  const searchForOpportunities = useMutation(api.newsjacking.searchForOpportunities);
  const dismissOpportunity = useMutation(api.newsjacking.dismissOpportunity);

  return {
    opportunities: opportunities?.map(opp => ({
      ...opp,
      id: opp._id,
    })) || [],
    searchForOpportunities,
    dismissOpportunity: async (opportunityId: string) => {
      await dismissOpportunity({ opportunityId });
    },
    isLoading: opportunities === undefined,
  };
};

// Extract keywords using the HTTP endpoint
export const extractKeywordsWithGemini = async (
  brandGuide: string
): Promise<Keyword[]> => {
  try {
    const response = await fetch('/extract-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: brandGuide }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.keywords || [];
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
};

// Generate article using the HTTP endpoint
export const generateArticle = async (opportunityId: string): Promise<string> => {
  try {
    const response = await fetch('/generate-article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ opportunityId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.article || '';
  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
};