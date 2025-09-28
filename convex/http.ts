import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// HTTP endpoint for keyword extraction
http.route({
  path: "/extract-keywords",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { content } = await request.json();

    if (!content) {
      return new Response("Content is required", { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return new Response("Gemini API key not configured", { status: 500 });
    }

    try {
      // Call Gemini API to extract keywords
      const prompt = `
You are a keyword extraction expert for newsjacking and content marketing. Analyze the following brand guide and extract relevant keywords that would be useful for monitoring news and creating content.

For each keyword, categorize it as one of:
- industry: Terms related to the industry field
- values: Core values, principles, or mission statements
- products: Specific products, services, or offerings
- competitors: Competitor names or competitive terms

Also assign a weight (0.1-1.0) based on importance and relevance to the brand.

Return your response as a JSON array with this structure:
[
  {
    "term": "keyword phrase",
    "weight": 0.8,
    "category": "industry|values|products|competitors"
  }
]

Brand Guide:
${content}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`,
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
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const geminiResponse = await response.json();
      const responseText = geminiResponse.candidates[0].content.parts[0].text;

      // Parse the JSON response from Gemini
      let keywords;
      try {
        // Extract JSON from the response (in case there's surrounding text)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          keywords = JSON.parse(jsonMatch[0]);
        } else {
          keywords = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", responseText);
        keywords = [];
      }

      // Format keywords for our frontend
      const formattedKeywords = keywords.map((kw: any) => ({
        term: kw.term,
        weight: kw.weight || 0.5,
        category: kw.category || "industry",
        userPreference: 1.0,
        isActive: true,
      }));

      return new Response(JSON.stringify({ keywords: formattedKeywords }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Error extracting keywords:", error);
      return new Response(JSON.stringify({ keywords: [] }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// HTTP endpoint for generating articles
http.route({
  path: "/generate-article",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { opportunityId } = await request.json();

    if (!opportunityId) {
      return new Response("Opportunity ID is required", { status: 400 });
    }

    // This would integrate with Gemini API for article generation
    const article = "Article generation functionality will be implemented when connected to the real backend.";

    return new Response(JSON.stringify({ article }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;