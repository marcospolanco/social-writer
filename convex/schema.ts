import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for authentication
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  // Brand guides stored in Convex file storage
  brandGuides: defineTable({
    userId: v.id("users"),
    fileId: v.union(v.id("_storage"), v.string()), // Can be storage ID or custom ID
    fileName: v.string(),
    fileSize: v.number(),
    fileContent: v.optional(v.string()), // Store file content directly as base64
    uploadedAt: v.number(),
    processed: v.boolean(),
    processingError: v.optional(v.string())
  })
    .index("by_user", ["userId"])
    .index("by_processed", ["processed"]),

  // Search queries extracted from brand guides (hybrid approach)
  searchQueries: defineTable({
    userId: v.id("users"),
    brandGuideId: v.id("brandGuides"), // Reference to the brand guide
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
    brandEmbedding: v.array(v.number()), // Vector embedding for similarity ranking
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"]),

  // Article opportunities from Tavily searches
  opportunities: defineTable({
    userId: v.id("users"),
    title: v.string(),
    summary: v.string(),
    source: v.string(),
    url: v.string(),
    publishedAt: v.number(),
    content: v.string(), // Full article content
    similarityScore: v.number(), // Cosine similarity with brand embedding
    finalScore: v.number(), // Weighted final ranking score
    isTrending: v.boolean(),
    isDismissed: v.boolean(),
    // AI-generated content strategy
    aiBrief: v.optional(v.object({
      title: v.string(),
      brief: v.string(),
      emotion: v.string(),
      generatedAt: v.number()
    })),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_user_dismissed", ["userId", "isDismissed"])
    .index("by_score", ["finalScore"])
    .index("by_created", ["createdAt"])
    .index("by_trending", ["isTrending", "createdAt"]),

  // Generated articles
  articles: defineTable({
    userId: v.id("users"),
    content: v.string(),
    sourceOpportunity: v.id("opportunities"),
    status: v.union(v.literal("draft"), v.literal("published")),
    createdAt: v.number(),
    publishedAt: v.optional(v.number())
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
});