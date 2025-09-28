import { mutation, query, action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Pure JavaScript base64 decoder that works in Convex environment
function base64Decode(base64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;

  while (i < base64.length) {
    let encoded1 = chars.indexOf(base64.charAt(i++));
    let encoded2 = chars.indexOf(base64.charAt(i++));
    let encoded3 = chars.indexOf(base64.charAt(i++));
    let encoded4 = chars.indexOf(base64.charAt(i++));

    let bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

    result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
  }

  return result;
}

// Helper function to get or create development user
async function getOrCreateDevUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (identity) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user) return user;
  }

  // For development, get or create a default user
  const defaultUsers = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", "dev@local.host"))
    .collect();

  if (defaultUsers.length > 0) {
    return defaultUsers[0];
  }

  // Create development user
  const newUserId = await ctx.db.insert("users", {
    name: "Development User",
    email: "dev@local.host",
    tokenIdentifier: "dev-token",
    imageUrl: "",
  });

  // Return the full user object
  const newUser = await ctx.db.get(newUserId);
  return newUser;
}

// Helper function to create an embedding using OpenAI API
async function createOpenAIEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured in Convex environment variables.");
  }

  const result = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text,
    }),
  });

  const json = await result.json();
  if (!result.ok) {
    console.error("OpenAI API Error:", json.error.message);
    throw new Error(`Failed to create embedding: ${json.error.message}`);
  }
  
  const embedding = json.data[0].embedding;
  console.log(`✅ Embedding created successfully, length: ${embedding.length}`);
  return embedding;
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  published_date: string;
  source: string;
}

interface TavilyMCPResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content: Array<{
      type: string;
      text: string;
    }>;
  };
  error?: {
    message: string;
  };
}

// Search Tavily using REST API directly
const searchTavilyMCP = async (query: string, maxResults: number = 5): Promise<TavilySearchResult[]> => {
  console.log(`🌐 searchTavilyMCP: Starting search for "${query}" (max results: ${maxResults})`);

  const tavilyApiKey = process.env.TAVILY_API_KEY;
  console.log(`🌐 searchTavilyMCP: TAVILY_API_KEY configured:`, !!tavilyApiKey);

  if (!tavilyApiKey) {
    console.error(`🌐 searchTavilyMCP: TAVILY_API_KEY not configured in environment variables`);
    throw new Error("TAVILY_API_KEY environment variable not configured. Please add it to your Convex deployment environment variables.");
  }

  try {
    console.log(`🌐 searchTavilyMCP: Sending request to Tavily REST API...`);

    const requestBody = {
      query,
      max_results: maxResults,
      time_period: "24h",
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
      include_images: false,
    };
    console.log(`🌐 searchTavilyMCP: Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tavilyApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`🌐 searchTavilyMCP: Response status:`, response.status, response.statusText);

    if (!response.ok) {
      console.error(`🌐 searchTavilyMCP: HTTP error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`🌐 searchTavilyMCP: Error response:`, errorText);
      throw new Error(`Tavily API request failed: ${response.status} ${response.statusText}`);
    }

    const searchResponse = await response.json();
    console.log(`🌐 searchTavilyMCP: API response received:`, JSON.stringify(searchResponse, null, 2));

    if (!searchResponse.results || !Array.isArray(searchResponse.results)) {
      console.log(`🌐 searchTavilyMCP: No results found in API response`);
      return [];
    }

    console.log(`🌐 searchTavilyMCP: Found ${searchResponse.results.length} results`);

    // Log the first result to see all available fields
    if (searchResponse.results.length > 0) {
      console.log(`🌐 searchTavilyMCP: First result fields:`, Object.keys(searchResponse.results[0]));
      console.log(`🌐 searchTavilyMCP: First result sample:`, searchResponse.results[0]);
    }

    // Transform Tavily API response to our expected format
    const results = searchResponse.results.map((result: any) => {
      // Try different possible field names for source
      const source = result.source ||
                     result.domain ||
                     result.hostname ||
                     result.publication ||
                     result.publisher ||
                     "Unknown";

      console.log(`🌐 searchTavilyMCP: Processing "${result.title}" - trying source fields:`, {
        source: result.source,
        domain: result.domain,
        hostname: result.hostname,
        publication: result.publication,
        publisher: result.publisher,
        finalSource: source
      });

      return {
        title: result.title,
        url: result.url,
        content: result.content,
        published_date: result.published_date || new Date().toISOString(),
        source: source
      };
    });

    return results;
  } catch (error) {
    console.error(`🌐 searchTavilyMCP: Error searching Tavily API:`, error);
    throw error;
  }
};

// Brand guide file storage and processing - simplified approach
export const uploadBrandGuide = mutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    fileContent: v.string(), // Store file content directly as base64
  },
  handler: async (ctx, args) => {
    // Get or create development user
    const user = await getOrCreateDevUser(ctx);
    if (!user || !user._id) {
      throw new Error("User not found or invalid user object");
    }

    // Delete any existing brand guides for this user (enforce single guide per user)
    const existingGuides = await ctx.db
      .query("brandGuides")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const guide of existingGuides) {
      await ctx.db.delete(guide._id);
    }

    // Generate a simple file ID for now (we'll use the file content hash)
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create brand guide record with file content stored directly
    const brandGuideId = await ctx.db.insert("brandGuides", {
      userId: user._id,
      fileId: fileId, // Use our generated ID
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileContent: args.fileContent, // Store the actual file content
      uploadedAt: Date.now(),
      processed: false,
    });

    // Return success without upload URL since we're storing content directly
    return { success: true, brandGuideId };
  },
});

// Update brand guide record with actual storage ID after upload
export const updateBrandGuideStorageId = mutation({
  args: {
    brandGuideId: v.id("brandGuides"),
    storageId: v.string(), // Accept string and convert to storage ID
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateDevUser(ctx);
    if (!user) throw new Error("User not found");

    // Update the brand guide record with the actual storage ID
    await ctx.db.patch(args.brandGuideId, {
      fileId: args.storageId as any, // Cast to storage ID
    });

    return { success: true };
  },
});

export const getBrandGuide = query({
  args: {},
  handler: async (ctx) => {
    // Try to get authenticated user first
    const identity = await ctx.auth.getUserIdentity();
    let user = null;

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    }

    // If no authenticated user, fall back to development user
    if (!user) {
      const devUsers = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "dev@local.host"))
        .collect();

      if (devUsers.length > 0) {
        user = devUsers[0];
      }
    }

    if (!user) return null;

    const brandGuide = await ctx.db
      .query("brandGuides")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return brandGuide;
  },
});

export const getBrandGuideContent = action({
  args: { brandGuideId: v.id("brandGuides") },
  handler: async (ctx, args) => {
    const brandGuide = await ctx.runQuery(internal.newsjacking.getBrandGuideById, {
      brandGuideId: args.brandGuideId,
    });

    if (!brandGuide) {
      throw new Error("Brand guide not found");
    }

    // Check if we have file content stored directly
    if (brandGuide.fileContent) {
      // Decode base64 content and return it (Node.js compatible)
      try {
        console.log("🔍 File content details:", {
          length: brandGuide.fileContent.length,
          startsWithDataUrl: brandGuide.fileContent.startsWith('data:'),
          first100Chars: brandGuide.fileContent.substring(0, 100),
          isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(brandGuide.fileContent)
        });

        // If it starts with data:, extract the base64 part
        let contentToDecode = brandGuide.fileContent;
        if (contentToDecode.startsWith('data:')) {
          const base64Part = contentToDecode.split(',')[1];
          if (!base64Part) {
            throw new Error("Invalid data URL format");
          }
          contentToDecode = base64Part;
        }

        // Use pure JavaScript base64 decoding (works in Convex environment)
        const decoded = base64Decode(contentToDecode);
        console.log("✅ Successfully decoded file content, length:", decoded.length);
        return decoded;
      } catch (error) {
        console.error("❌ Failed to decode file content:", error);
        console.error("❌ Error details:", {
          message: (error as Error).message,
          stack: (error as Error).stack
        });
        throw new Error("Failed to decode file content");
      }
    }

    // If no stored content, check if fileId is a storage ID
    if (typeof brandGuide.fileId === 'string' && brandGuide.fileId.startsWith('http')) {
      throw new Error("File upload not completed properly. Please try uploading again.");
    } else {
      // Try to get from storage
      try {
        const fileUrl = await ctx.storage.getUrl(brandGuide.fileId);
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch brand guide content");
        }
        return await response.text();
      } catch (error) {
        throw new Error("Failed to get file URL from storage. The file may not have been uploaded correctly.");
      }
    }
  },
});

export const getBrandGuideById = internalQuery({
  args: { brandGuideId: v.id("brandGuides") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.brandGuideId);
  },
});

// Search queries management for hybrid approach
export const getSearchQueries = query({
  args: {},
  handler: async (ctx) => {
    // Try to get authenticated user first
    const identity = await ctx.auth.getUserIdentity();
    let user = null;

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    }

    // If no authenticated user, fall back to development user
    if (!user) {
      const devUsers = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "dev@local.host"))
        .collect();

      if (devUsers.length > 0) {
        user = devUsers[0];
      }
    }

    if (!user) return null;

    const searchQueries = await ctx.db
      .query("searchQueries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter(q => q.eq(q.field("isActive"), true))
      .first();

    return searchQueries;
  },
});

// Internal query to get development user ID
export const getDevUserId = internalQuery({
  args: {},
  handler: async (ctx) => {
    const devUsers = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "dev@local.host"))
      .collect();

    if (devUsers.length > 0) {
      return devUsers[0]._id;
    }
    return null;
  },
});

// Internal query to get search queries for a specific user
export const getSearchQueriesForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("searchQueries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .first();
  },
});

// Internal mutation to save multiple opportunities
export const saveOpportunities = internalMutation({
  args: {
    opportunities: v.array(v.object({
      userId: v.id("users"),
      title: v.string(),
      summary: v.string(),
      content: v.string(),
      source: v.string(),
      url: v.string(),
      publishedAt: v.number(),
      similarityScore: v.number(),
      finalScore: v.number(),
      isTrending: v.boolean(),
      isDismissed: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    const savedOpportunities = [];
    for (const opportunityData of args.opportunities) {
      // Check if opportunity already exists
      const existing = await ctx.db
        .query("opportunities")
        .withIndex("by_user_created", (q) => q.eq("userId", opportunityData.userId))
        .filter(q => q.eq(q.field("url"), opportunityData.url))
        .first();

      if (!existing) {
        const opportunityId = await ctx.db.insert("opportunities", opportunityData);
        savedOpportunities.push(opportunityId);
        console.log(`🔍 saveOpportunities: Created new opportunity: ${opportunityId}`);
      } else {
        console.log(`🔍 saveOpportunities: Opportunity already exists, skipping: ${existing._id}`);
      }
    }
    return savedOpportunities;
  },
});

export const saveSearchQueries = internalMutation({
  args: {
    userId: v.id("users"),
    brandGuideId: v.id("brandGuides"),
    queries: v.array(v.object({
      term: v.string(),
      weight: v.number(),
      category: v.union(
        v.literal("industry"),
        v.literal("values"),
        v.literal("products"),
        v.literal("competitors")
      )
    })),
    brandEmbedding: v.array(v.number())
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Deactivate existing search queries for this user
    const existingQueries = await ctx.db
      .query("searchQueries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const query of existingQueries) {
      await ctx.db.patch(query._id, { isActive: false, updatedAt: now });
    }

    // Create new search queries
    await ctx.db.insert("searchQueries", {
      userId: args.userId,
      brandGuideId: args.brandGuideId,
      queries: args.queries,
      brandEmbedding: args.brandEmbedding,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Search for opportunities using hybrid approach - internal action for cron job
export const searchForOpportunities = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all active search queries
    const activeSearchQueries = await ctx.runQuery(internal.newsjacking.getActiveSearchQueries);

    for (const searchQuery of activeSearchQueries) {
      try {
        // Search Tavily for each query
        const results = await searchTavilyMCP(searchQuery.term, 3);

        // Process results with vector similarity ranking
        const rankedResults = await ctx.runAction(internal.newsjacking.rankResultsBySimilarity, {
          results,
          brandEmbedding: searchQuery.brandEmbedding,
          userId: searchQuery.userId
        });

        // Save opportunities
        for (const result of rankedResults) {
          await ctx.runMutation(internal.newsjacking.saveOpportunity, result);
        }
      } catch (error) {
        console.error(`Error searching for query "${searchQuery.term}":`, error);
      }
    }
  },
});

// Internal query to get active search queries
export const getActiveSearchQueries = internalQuery({
  args: {},
  handler: async (ctx) => {
    const activeQueries = await ctx.db
      .query("searchQueries")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Flatten all queries from all users
    const allQueries = activeQueries.flatMap(sq =>
      sq.queries.map(query => ({
        ...query,
        userId: sq.userId,
        brandEmbedding: sq.brandEmbedding
      }))
    );

    return allQueries;
  },
});

// Internal action to rank results by similarity
export const rankResultsBySimilarity = internalAction({
  args: {
    results: v.array(v.any()),
    brandEmbedding: v.array(v.number()),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // For now, skip vector embedding and use basic scoring
    const rankedResults = [];
    for (const result of args.results) {
      try {
        // Generate embedding for the result content
        const resultEmbedding = await createOpenAIEmbedding(result.content);

        // Calculate the cosine similarity between the brand and the result
        const similarityScore = calculateCosineSimilarity(args.brandEmbedding, resultEmbedding);
        const finalScore = calculateFinalScore(result, similarityScore);

        rankedResults.push({
          userId: args.userId,
          title: result.title,
          summary: result.content.substring(0, 300) + (result.content.length > 300 ? "..." : ""),
          content: result.content,
          source: result.source,
          url: result.url,
          publishedAt: new Date(result.published_date).getTime(),
          similarityScore,
          finalScore,
          isTrending: calculateTrendingScore(result) > 0.5, // Convert to boolean
          isDismissed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.error("Error processing result:", error);
      }
    }

    return rankedResults.sort((a, b) => b.finalScore - a.finalScore);
  },
});

// Internal mutation to save opportunity
export const saveOpportunity = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    summary: v.string(),
    content: v.string(),
    source: v.string(),
    url: v.string(),
    publishedAt: v.number(),
    similarityScore: v.number(),
    finalScore: v.number(),
    isTrending: v.boolean(),
    isDismissed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if opportunity already exists
    const existing = await ctx.db
      .query("opportunities")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("url"), args.url))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("opportunities", args);
  },
});

// Get opportunity by ID
export const getOpportunityById = internalQuery({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.opportunityId);
  },
});

// Get brand guide by user
export const getBrandGuideByUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brandGuides")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
  },
});

// Generate AI briefs for opportunities
export const generateAIBriefs = action({
  args: {
    opportunityIds: v.array(v.id("opportunities")),
    emotion: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    console.log("🤖 generateAIBriefs: Starting brief generation for", args.opportunityIds.length, "opportunities");

    // Get user ID from development user
    const userId = await ctx.runQuery(internal.newsjacking.getDevUserId);
    if (!userId) {
      console.log("🤖 generateAIBriefs: No development user found");
      return { success: false, message: "User not found" };
    }

    // Get brand guide content
    const brandGuide = await ctx.runQuery(internal.newsjacking.getBrandGuideByUser, { userId });
    if (!brandGuide) {
      console.log("🤖 generateAIBriefs: No brand guide found");
      return { success: false, message: "Brand guide not found" };
    }

    const brandGuideContent = await ctx.runAction(internal.newsjacking.getBrandGuideContent, {
      brandGuideId: brandGuide._id
    });

    console.log("🤖 generateAIBriefs: Brand guide content length:", brandGuideContent.length);

    // Generate briefs for each opportunity
    const results = [];
    for (const opportunityId of args.opportunityIds) {
      try {
        const opportunity = await ctx.runQuery(internal.newsjacking.getOpportunityById, { opportunityId });
        if (!opportunity || opportunity.userId !== userId) {
          console.log("🤖 generateAIBriefs: Opportunity not found or doesn't belong to user", opportunityId);
          continue;
        }

        console.log("🤖 generateAIBriefs: Generating brief for opportunity:", opportunity.title);

        // Use provided emotion or randomly select one
        const emotion = args.emotion || (() => {
          const emotions = [
            "Curiosity", "Surprise", "Inspiration", "Amusement", "Awe",
            "Joy", "Hope", "Pride", "Gratitude", "Excitement"
          ];
          return emotions[Math.floor(Math.random() * emotions.length)];
        })();

        // Generate AI brief
        const brief = await generateAIBriefContent(
          opportunity,
          brandGuideContent,
          emotion,
          userId
        );

        // Update opportunity with AI brief
        await ctx.runMutation(internal.newsjacking.updateOpportunityWithBrief, {
          opportunityId,
          brief: {
            title: brief.title,
            brief: brief.brief,
            emotion: emotion,
            generatedAt: Date.now()
          }
        });

        console.log("🤖 generateAIBriefs: Brief generated successfully for opportunity:", opportunity.title);
        results.push({ opportunityId, success: true });
      } catch (error) {
        console.error("🤖 generateAIBriefs: Error generating brief for opportunity", opportunityId, ":", error);
        results.push({ opportunityId, success: false, error: String(error) });
      }
    }

    return { success: true, results };
  },
});

// Helper function to generate AI brief content
const generateAIBriefContent = async (
  opportunity: any,
  brandGuideContent: string,
  emotion: string,
  userId: any
): Promise<{ title: string; brief: string }> => {
  // If emotion is not provided, randomly select one
  if (!emotion || emotion === "") {
    const emotions = [
      "Curiosity",
      "Surprise",
      "Inspiration",
      "Amusement",
      "Awe",
      "Joy",
      "Hope",
      "Pride",
      "Gratitude",
      "Excitement"
    ];
    emotion = emotions[Math.floor(Math.random() * emotions.length)];
  }
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = `Create a LinkedIn article title and brief based on:

Title: ${opportunity.title}
Summary: ${opportunity.summary}
Target Emotion: ${emotion}

Brand Context: ${brandGuideContent.substring(0, 1000)}...

Respond in JSON format:
{
  "title": "Article title",
  "brief": "3-4 sentence brief connecting brand to this topic"
}`;

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
    throw new Error(`Failed to generate AI brief: ${response.status}`);
  }

  const geminiResponse = await response.json();
  console.log("🤖 Gemini API response:", JSON.stringify(geminiResponse, null, 2));

  if (!geminiResponse.candidates || !geminiResponse.candidates[0] || !geminiResponse.candidates[0].content || !geminiResponse.candidates[0].content.parts || !geminiResponse.candidates[0].content.parts[0]) {
    // Check if it's a MAX_TOKENS issue
    if (geminiResponse.candidates && geminiResponse.candidates[0] && geminiResponse.candidates[0].finishReason === "MAX_TOKENS") {
      throw new Error("Response exceeded token limit - please try with a shorter prompt");
    }
    throw new Error("Invalid Gemini API response structure");
  }

  const responseText = geminiResponse.candidates[0].content.parts[0].text;

  // Clean up response text (remove markdown code blocks if present)
  let cleanText = responseText;
  if (responseText.includes('```json')) {
    cleanText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
  }

  // Parse JSON response
  try {
    const result = JSON.parse(cleanText);
    return {
      title: result.title || opportunity.title,
      brief: result.brief || "Brief generation failed"
    };
  } catch (parseError) {
    // Fallback if JSON parsing fails
    return {
      title: opportunity.title,
      brief: cleanText
    };
  }
};

// Update opportunity with AI brief
export const updateOpportunityWithBrief = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    brief: v.object({
      title: v.string(),
      brief: v.string(),
      emotion: v.string(),
      generatedAt: v.number()
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.opportunityId, {
      aiBrief: args.brief,
      updatedAt: Date.now()
    });
    return { success: true };
  },
});

// Manual search trigger for users (action)
export const triggerManualSearch = action({
  args: {},
  handler: async (ctx) => {
    console.log("🔍 triggerManualSearch: Starting manual search...");

    // Get user ID from development user
    const userId = await ctx.runQuery(internal.newsjacking.getDevUserId);
    if (!userId) {
      console.log("🔍 triggerManualSearch: No development user found");
      return { success: false, message: "User not found" };
    }

    console.log("🔍 triggerManualSearch: User found:", userId);

    // Get active search queries for this user
    const searchQueries = await ctx.runQuery(internal.newsjacking.getSearchQueriesForUser, { userId });
    if (!searchQueries || !searchQueries.queries || searchQueries.queries.length === 0) {
      console.log("🔍 triggerManualSearch: No active search queries found for user");
      return { success: false, message: "No search queries configured" };
    }

    console.log("🔍 triggerManualSearch: Found", searchQueries.queries.length, "search queries:", searchQueries.queries);

    // Process each query
    const results = [];
    for (const query of searchQueries.queries) {
      console.log(`🔍 triggerManualSearch: Processing query "${query.term}" (weight: ${query.weight}, category: ${query.category})`);

      try {
        // Search Tavily for this query
        const searchResults = await searchTavilyMCP(query.term, 3);
        console.log(`🔍 triggerManualSearch: Tavily returned ${searchResults.length} results for "${query.term}"`);

        // Process each result
        for (const result of searchResults) {
          console.log(`🔍 triggerManualSearch: Processing result: "${result.title}" from ${result.source}`);

          // Generate embedding for the result content
          const resultEmbedding = await createOpenAIEmbedding(result.content);

          // Calculate the cosine similarity between the brand and the result
          const similarityScore = calculateCosineSimilarity(searchQueries.brandEmbedding, resultEmbedding);
          const finalScore = calculateFinalScore(result, similarityScore);
          const isTrending = calculateTrendingScore(result) > 0.5;

          console.log(`🔍 triggerManualSearch: Score ${finalScore}, Trending: ${isTrending}`);

          const opportunityData = {
            userId,
            title: result.title,
            summary: result.content.substring(0, 300) + (result.content.length > 300 ? "..." : ""),
            content: result.content,
            source: result.source,
            url: result.url,
            publishedAt: new Date(result.published_date).getTime(),
            similarityScore,
            finalScore,
            isTrending,
            isDismissed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          results.push(opportunityData);
        }
      } catch (error) {
        console.error(`🔍 triggerManualSearch: Error processing query "${query.term}":`, error);
      }
    }

    // Save all opportunities via mutation
    console.log(`🔍 triggerManualSearch: Saving ${results.length} opportunities...`);
    const savedOpportunities = await ctx.runMutation(internal.newsjacking.saveOpportunities, { opportunities: results });

    // Auto-generate AI briefs for the saved opportunities using "Curiosity" as default emotion
    if (savedOpportunities.length > 0) {
      console.log("🔍 triggerManualSearch: Auto-generating AI briefs for saved opportunities...");
      try {
        const opportunityIds = savedOpportunities.map((opp: any) => opp._id);
        await ctx.runAction(internal.newsjacking.generateAIBriefs, {
          opportunityIds
        });
        console.log("🔍 triggerManualSearch: AI briefs generated successfully");
      } catch (error) {
        console.error("🔍 triggerManualSearch: Error generating AI briefs:", error);
        // Don't fail the whole process if brief generation fails
      }
    }

    console.log("🔍 triggerManualSearch: Manual search completed successfully");
    return { success: true, message: "Search triggered successfully", opportunitiesSaved: savedOpportunities.length };
  },
});

// Get user's opportunities
export const getOpportunities = query({
  args: {
    includeDismissed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Try to get authenticated user first
    const identity = await ctx.auth.getUserIdentity();
    let user = null;

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    }

    // If no authenticated user, fall back to development user
    if (!user) {
      const devUsers = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "dev@local.host"))
        .collect();

      if (devUsers.length > 0) {
        user = devUsers[0];
      }
    }

    if (!user) {
      return [];
    }

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_user_dismissed", (q) =>
        q.eq("userId", user._id).eq("isDismissed", args.includeDismissed ? true : false)
      )
      .order("desc")
      .take(50);

    return opportunities.map((opp) => ({
      id: opp._id,
      title: opp.title,
      summary: opp.summary,
      source: opp.source,
      url: opp.url,
      publishedAt: opp.publishedAt,
      keywords: [], // TODO: Extract keywords from content or brand guide
      baseScore: opp.similarityScore,
      dynamicScore: opp.finalScore,
      trendingScore: opp.isTrending ? 1.0 : 0.0,
      isTrending: opp.isTrending,
      aiBrief: opp.aiBrief ? {
        title: opp.aiBrief.title,
        brief: opp.aiBrief.brief,
        emotion: opp.aiBrief.emotion,
        generatedAt: opp.aiBrief.generatedAt
      } : null,
    }));
  },
});

// Dismiss an opportunity
export const dismissOpportunity = mutation({
  args: {
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateDevUser(ctx);
    if (!user) throw new Error("User not found");

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity || opportunity.userId !== user._id) {
      throw new Error("Opportunity not found");
    }

    await ctx.db.patch(args.opportunityId, {
      isDismissed: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete all opportunities for the current user
export const deleteMyOpportunities = mutation({
  args: {},
  handler: async (ctx, args) => {
    const user = await getOrCreateDevUser(ctx);
    if (!user) throw new Error("User not found");

    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .collect();

    let deletedCount = 0;
    for (const opportunity of opportunities) {
      await ctx.db.delete(opportunity._id);
      deletedCount++;
    }

    console.log(`🗑️ Deleted ${deletedCount} opportunities for user ${user._id}`);
    return { success: true, deletedCount };
  },
});

// Process brand guide using hybrid approach with file storage
export const processBrandGuide = action({
  args: {
    brandGuideId: v.id("brandGuides"),
  },
  handler: async (ctx, args) => {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    console.log(`🔑 OPENAI_API_KEY is defined: ${!!openaiApiKey}, Length: ${openaiApiKey?.length || 0}`);

    try {
      // Get the brand guide content from file storage
      const brandGuideContent = await ctx.runAction(internal.newsjacking.getBrandGuideContent, {
        brandGuideId: args.brandGuideId,
      });

      // Extract search queries from brand guide using Gemini
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("Gemini API key not configured");
      }

      const prompt = `
You are a search query extraction expert for newsjacking and content marketing. Analyze the following brand guide and extract search queries that would be useful for monitoring news and creating content.

For each search query, categorize it as one of:
- industry: Terms related to the industry field
- values: Core values, principles, or mission statements
- products: Specific products, services, or offerings
- competitors: Competitor names or competitive terms

Also assign a weight (0.1-1.0) based on importance and relevance to the brand.

Return your response as a JSON array with this structure:
[
  {
    "term": "search query phrase",
    "weight": 0.8,
    "category": "industry|values|products|competitors"
  }
]

Brand Guide:
${brandGuideContent}
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
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const geminiResponse = await response.json();

      // Log the response structure for debugging
      // console.log("Gemini API response structure:", JSON.stringify(geminiResponse, null, 2));

      // Safely access the response
      if (!geminiResponse.candidates || !geminiResponse.candidates[0] || !geminiResponse.candidates[0].content || !geminiResponse.candidates[0].content.parts || !geminiResponse.candidates[0].content.parts[0]) {
        throw new Error("Invalid Gemini API response structure");
      }

      const responseText = geminiResponse.candidates[0].content.parts[0].text;

      // Parse the JSON response from Gemini
      let searchQueries;
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          searchQueries = JSON.parse(jsonMatch[0]);
        } else {
          searchQueries = JSON.parse(responseText);
        }
      } catch (error) {
        console.error("Error parsing Gemini response:", responseText);
        searchQueries = [];
      }

      // Get the brand guide record to get userId
      const brandGuide = await ctx.runQuery(internal.newsjacking.getBrandGuideById, {
        brandGuideId: args.brandGuideId,
      });

      if (!brandGuide) {
        throw new Error("Brand guide not found");
      }

      // Create brand embedding using our new helper function
      const brandEmbedding = await createOpenAIEmbedding(brandGuideContent);

      try {
        // Save search queries and brand embedding
        console.log("💾 Saving search queries...");
        console.log("📊 Query count:", searchQueries.length);
        console.log("🔍 Sample queries:", searchQueries.slice(0, 2).map((sq: any) => sq.term));

        console.log("📐 Embedding being saved:", {
          length: brandEmbedding.length,
          first3: brandEmbedding.slice(0, 3),
          hasValidNumbers: brandEmbedding.every(n => typeof n === 'number' && !isNaN(n))
        });

        await ctx.runMutation(internal.newsjacking.saveSearchQueries, {
          userId: brandGuide.userId,
          brandGuideId: args.brandGuideId,
          queries: searchQueries.map((sq: any) => ({
            term: sq.term,
            weight: sq.weight || 0.5,
            category: sq.category || "industry"
          })),
          brandEmbedding
        });
        console.log("✅ Search queries saved successfully");
        console.log("🎯 Set isActive: true for", searchQueries.length, "queries");
      } catch (saveError) {
        console.error("❌ Failed to save search queries:", saveError);
        // Continue processing even if search queries fail to save
      }

      // Mark brand guide as processed (this is critical for UI to work)
      console.log("📝 Marking brand guide as processed...");
      await ctx.runMutation(internal.newsjacking.markBrandGuideProcessed, {
        brandGuideId: args.brandGuideId,
        processed: true,
      });
      console.log("✅ Brand guide marked as processed");

      return {
        success: true,
        searchQueries,
        message: `Extracted ${searchQueries.length} search queries from brand guide`
      };

    } catch (error) {
      console.error("Error processing brand guide:", error);

      // Mark brand guide as failed
      await ctx.runMutation(internal.newsjacking.markBrandGuideProcessed, {
        brandGuideId: args.brandGuideId,
        processed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

export const markBrandGuideProcessed = internalMutation({
  args: {
    brandGuideId: v.id("brandGuides"),
    processed: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.brandGuideId, {
      processed: args.processed,
      processingError: args.error,
    });
  },
});


// Helper functions for score calculation
const calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length === 0 || vecB.length === 0) return 0;

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

interface SearchResult {
  published_date: string;
  source: string;
}

const calculateFinalScore = (result: SearchResult, similarityScore: number): number => {
  const now = Date.now();

  // Safely calculate age in hours
  let ageInHours = 0;
  try {
    const publishedTime = new Date(result.published_date).getTime();
    if (!isNaN(publishedTime)) {
      ageInHours = (now - publishedTime) / (1000 * 60 * 60);
    }
  } catch (error) {
    console.warn(`Error parsing published_date "${result.published_date}":`, error);
    ageInHours = 24; // Default to 24 hours old if parsing fails
  }

  // Weight factors
  const similarityWeight = 0.6;  // 60% semantic relevance
  const recencyWeight = 0.25;     // 25% recency boost
  const sourceWeight = 0.15;     // 15% source credibility

  // Recency boost (ensure it's a valid number)
  const recencyBoost = Math.max(0, Math.min(1, 1 - ageInHours / 48)); // Clamp between 0-1

  // Source credibility
  const credibleSources = ["reuters", "associated press", "bloomberg", "techcrunch", "forbes"];
  const sourceScore = credibleSources.some((source) =>
    result.source && result.source.toLowerCase().includes(source)
  ) ? 1.2 : 1.0;

  // Calculate final score with validation
  const safeSimilarityScore = isNaN(similarityScore) ? 0.5 : Math.max(0, Math.min(1, similarityScore));

  const finalScore = (
    safeSimilarityScore * similarityWeight +
    recencyBoost * recencyWeight +
    sourceScore * sourceWeight
  );

  // Ensure we return a valid number between 0 and 1
  return Math.max(0, Math.min(1, finalScore || 0.5));
};

const calculateTrendingScore = (result: SearchResult): number => {
  const now = Date.now();

  // Safely calculate age in hours
  let ageInHours = 24; // Default to 24 hours if parsing fails
  try {
    const publishedTime = new Date(result.published_date).getTime();
    if (!isNaN(publishedTime)) {
      ageInHours = (now - publishedTime) / (1000 * 60 * 60);
    }
  } catch (error) {
    console.warn(`Error parsing published_date "${result.published_date}" for trending score:`, error);
  }

  // Very recent content gets higher trending score
  if (ageInHours < 1) return 0.9;
  if (ageInHours < 6) return 0.7;
  if (ageInHours < 24) return 0.5;
  return 0.3;
};