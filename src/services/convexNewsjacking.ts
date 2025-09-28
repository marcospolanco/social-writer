import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// Hook for managing brand guides, search queries and opportunities using Convex
export const useConvexNewsjacking = () => {
  const brandGuide = useQuery(api.newsjacking.getBrandGuide);
  const searchQueries = useQuery(api.newsjacking.getSearchQueries);
  const opportunities = useQuery(api.newsjacking.getOpportunities, { includeDismissed: false });

  const uploadBrandGuide = useMutation(api.newsjacking.uploadBrandGuide);
  const processBrandGuide = useAction(api.newsjacking.processBrandGuide);
  const triggerManualSearch = useAction(api.newsjacking.triggerManualSearch);
  const dismissOpportunity = useMutation(api.newsjacking.dismissOpportunity);
  const generateAIBriefs = useAction(api.newsjacking.generateAIBriefs);


  const isLoadingBrandGuide = brandGuide === undefined;
  const isLoadingSearchQueries = searchQueries === undefined;
  const isLoadingOpportunities = opportunities === undefined;

  const activeSearchQueries = searchQueries?.isActive ? searchQueries.queries : [];
  const totalQueryWeight = activeSearchQueries.reduce((sum: number, query: any) => sum + query.weight, 0);

  return {
    // Data
    brandGuide: brandGuide || null,
    searchQueries: searchQueries || null,
    opportunities: opportunities || [],
    activeSearchQueries,
    totalQueryWeight,

    // Loading states
    isLoadingBrandGuide,
    isLoadingSearchQueries,
    isLoadingOpportunities,

    // Actions
    uploadBrandGuide: async (file: File) => {
      // Read file content and convert to base64
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      // Step 1: Create brand guide record with file content
      const { brandGuideId } = await uploadBrandGuide({
        fileName: file.name,
        fileSize: file.size,
        fileContent,
      });

      // Step 2: Process the brand guide
      await processBrandGuide({ brandGuideId });

      return { success: true, brandGuideId };
    },

    triggerManualSearch: async () => {
      return await triggerManualSearch();
    },

    dismissOpportunity: async (opportunityId: string) => {
      return await dismissOpportunity({ opportunityId });
    },

    generateAIBriefs: async (opportunityIds: string[], emotion?: string) => {
      const args: any = { opportunityIds: opportunityIds as any };
      if (emotion) {
        args.emotion = emotion;
      }
      return await generateAIBriefs(args);
    },

    // Computed values
    hasBrandGuide: brandGuide !== null,
    hasActiveSearchQueries: searchQueries?.isActive && activeSearchQueries.length > 0,
    brandGuideProcessed: brandGuide?.processed || false,
    lastUpdateTime: searchQueries?.updatedAt || 0,
    opportunityCount: opportunities?.length || 0,
  };
};

// Hook for generating articles (keep on client-side for rapid iteration)
export const useArticleGeneration = () => {
  const generateArticle = async (
    opportunity: any,
    brandGuide: string,
    geminiApiKey: string,
    setEditorContent: (content: string) => void
  ) => {
    try {
      const prompt = `
You are a professional content writer. Generate a LinkedIn article based on the following opportunity and brand guide.

Article Opportunity:
Title: ${opportunity.title}
Summary: ${opportunity.summary}
Content: ${opportunity.content}
Source: ${opportunity.source}

Brand Guide:
${brandGuide}

Please write a professional LinkedIn article that:
1. References the current event/news mentioned in the opportunity
2. Aligns with the brand's voice and values from the brand guide
3. Provides valuable insights or commentary on the topic
4. Is engaging and appropriate for LinkedIn
5. Is between 800-1200 words

Return only the article content without any additional formatting or explanation.
`;

      const response = await fetch(
        
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate article: ${response.status}`);
      }

      const geminiResponse = await response.json();
      const articleContent = geminiResponse.candidates[0].content.parts[0].text;

      // Insert into editor
      setEditorContent(articleContent);

      return { success: true, content: articleContent };
    } catch (error) {
      console.error("Error generating article:", error);
      throw error;
    }
  };

  return {
    generateArticle,
  };
};