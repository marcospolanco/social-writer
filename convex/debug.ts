import { query } from "./_generated/server";
import { v } from "convex/values";

export const debugSearchQueries = query({
  args: {},
  handler: async (ctx) => {
    // Get all search queries
    const allQueries = await ctx.db.query("searchQueries").collect();

    // Get active search queries
    const activeQueries = await ctx.db
      .query("searchQueries")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Get brand guides
    const brandGuides = await ctx.db.query("brandGuides").collect();

    return {
      totalSearchQueries: allQueries.length,
      activeSearchQueries: activeQueries.length,
      brandGuides: brandGuides.map(bg => ({
        id: bg._id,
        processed: bg.processed,
        hasQueries: allQueries.some(q => q.brandGuideId === bg._id)
      })),
      sampleActiveQuery: activeQueries[0] || null,
      sampleQuery: allQueries[0] || null
    };
  },
});