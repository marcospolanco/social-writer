import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Cron job to trigger newsjacking search (will be configured in convex.json)
export const runNewsjackingSearch = mutation({
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.newsjacking.searchForOpportunities, {});
    return { success: true };
  },
});