import React, { useState } from 'react';
import { Search, RefreshCw, TrendingUp, Filter, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import OpportunityCard from './OpportunityCard';
import { useConvexNewsjacking, useArticleGeneration } from '../services/convexNewsjacking';

const NewsjackingDashboard: React.FC = () => {
  const {
    brandGuide,
    opportunities,
    activeSearchQueries,
    triggerManualSearch,
    dismissOpportunity,
    generateAIBriefs,
    hasBrandGuide,
    hasActiveSearchQueries,
    brandGuideProcessed,
    lastUpdateTime
  } = useConvexNewsjacking();

  const { generateArticle } = useArticleGeneration();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'industry' | 'values' | 'products' | 'competitors'>('all');
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleManualUpdate = async () => {
    setIsSearching(true);
    try {
      await triggerManualSearch();
    } catch (error) {
      console.error('Error updating opportunities:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateArticle = async (opportunityId: string) => {
    try {
      // Get the user's Gemini API key and brand guide from localStorage (client-side for rapid iteration)
      const geminiApiKey = localStorage.getItem('gemini_api_key');
      const brandGuide = localStorage.getItem('brand_guide');

      if (!geminiApiKey || !brandGuide) {
        alert('Please configure your Gemini API key and brand guide in the main application settings.');
        return;
      }

      const opportunity = opportunities.find(opp => opp.id === opportunityId);
      if (!opportunity) return;

      // Get the editor content setter from the main app context
      const setEditorContent = (window as any).setEditorContent ||
        ((content: string) => {
          // Fallback: switch to writer tab and set content
          const writerTab = document.querySelector('[data-tab="writer"]') as HTMLElement;
          if (writerTab) {
            writerTab.click();
          }

          // Try to set content in the editor
          const editor = document.querySelector('.ProseMirror') as HTMLElement;
          if (editor) {
            editor.textContent = content;
          }
        });

      await generateArticle(opportunity, brandGuide, geminiApiKey, setEditorContent);
    } catch (error) {
      console.error('Error generating article:', error);
      alert('Failed to generate article. Please check your API key and try again.');
    }
  };

  const handleDismissOpportunity = async (opportunityId: string) => {
    try {
      await dismissOpportunity({ opportunityId });
    } catch (error) {
      console.error('Error dismissing opportunity:', error);
    }
  };

  const handleStartWriting = async (opportunityId: string) => {
    try {
      const opportunity = opportunities.find(opp => opp.id === opportunityId);
      if (!opportunity || !opportunity.aiBrief) return;

      // Switch to writer tab
      const writerTab = document.querySelector('[data-tab="writer"]') as HTMLElement;
      if (writerTab) {
        writerTab.click();
      }

      // Insert the AI brief into the editor
      const setEditorContent = (window as any).setEditorContent ||
        ((content: string) => {
          const editor = document.querySelector('.ProseMirror') as HTMLElement;
          if (editor) {
            editor.textContent = content;
          }
        });

      // Create markdown content from the AI brief
      const markdownContent = `# ${opportunity.aiBrief.title}

${opportunity.aiBrief.brief}

---

## Original Article
**Title:** ${opportunity.title}
**Source:** ${opportunity.source}
**URL:** ${opportunity.url}

## Summary
${opportunity.summary}

---

*Generated using Social Writer with ${opportunity.aiBrief.emotion} emotion targeting*`;

      setEditorContent(markdownContent);
    } catch (error) {
      console.error('Error starting writing:', error);
      alert('Failed to start writing. Please try again.');
    }
  };

  const handleGenerateBriefs = async () => {
    setIsSearching(true);
    try {
      console.log("🎯 Generating AI briefs for existing opportunities...");
      console.log("🎯 Opportunities count:", opportunities.length);
      console.log("🎯 Opportunities with AI briefs:", opportunities.filter(opp => opp.aiBrief).length);
      console.log("🎯 Opportunities without AI briefs:", opportunities.filter(opp => !opp.aiBrief).length);

      // Get opportunities that don't have AI briefs yet
      const opportunitiesWithoutBriefs = opportunities.filter(opp => !opp.aiBrief);

      if (opportunitiesWithoutBriefs.length === 0) {
        alert('All opportunities already have AI briefs!');
        return;
      }

      console.log("🎯 Generating briefs for", opportunitiesWithoutBriefs.length, "opportunities");

      // Generate AI briefs for existing opportunities
      const opportunityIds = opportunitiesWithoutBriefs.map(opp => opp.id);
      await generateAIBriefs(opportunityIds);

      console.log("🎯 AI briefs generation completed");
      alert('AI briefs generated successfully! The cards will update shortly.');
    } catch (error) {
      console.error('Error generating briefs:', error);
      alert('Failed to generate briefs. Please check your API key and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesCategory = selectedCategory === 'all' ||
      activeSearchQueries.some(query => {
        // For now, we'll match by source as a simple proxy for category
        // In a real implementation, we'd store category info with opportunities
        return query.category === selectedCategory;
      });

    const matchesTrending = !showTrendingOnly || opp.isTrending;

    return matchesCategory && matchesTrending;
  });

  const formatTimeSince = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const formatTimeUntilNext = () => {
    // Next update is every 6 hours from last update
    const nextUpdateTime = lastUpdateTime + (6 * 60 * 60 * 1000);
    const timeUntilNext = Math.max(0, nextUpdateTime - Date.now());

    const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Newsjacking Dashboard</h2>
            <p className="text-sm text-gray-600">
              Monitor trending topics and generate relevant content automatically
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                {hasActiveSearchQueries ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Monitoring active
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    Brand guide needed
                  </>
                )}
              </div>
              <div className="text-xs text-gray-600">
                <span>Next update in {formatTimeUntilNext()}</span>
              </div>
            </div>
            <button
              onClick={handleManualUpdate}
              disabled={isSearching || !hasActiveSearchQueries}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Update Now</span>
                </>
              )}
            </button>
            <button
              onClick={handleGenerateBriefs}
              disabled={isSearching || opportunities.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors"
              title="Generate AI briefs for existing opportunities"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate Briefs</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="industry">Industry</option>
              <option value="values">Values</option>
              <option value="products">Products</option>
              <option value="competitors">Competitors</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTrendingOnly}
              onChange={(e) => setShowTrendingOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Trending only
            </span>
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 overflow-y-auto h-full">
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No opportunities found</h3>
              <p className="text-gray-600 mb-4">
                {!hasBrandGuide
                  ? "Click 'Add Brand Guide' in the header to get started."
                  : (brandGuideProcessed
                    ? 'Try adjusting your filters or updating for new opportunities'
                    : 'Your brand guide is being processed. Monitoring will begin soon.')
                }
              </p>
              {hasActiveSearchQueries && (
                <button
                  onClick={handleManualUpdate}
                  disabled={isSearching}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                  Update Opportunities
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Found {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
                  {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                  {showTrendingOnly && ' (trending only)'}
                </p>
              </div>

              {/* Single unified card layout */}
              <div className="space-y-4">
                {filteredOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onGenerate={handleGenerateArticle}
                    onDismiss={handleDismissOpportunity}
                    onStartWriting={handleStartWriting}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsjackingDashboard;