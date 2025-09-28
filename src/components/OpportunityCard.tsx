import React from 'react';
import { ExternalLink, TrendingUp, Clock, Zap, X, FileText, Sparkles } from 'lucide-react';
import { ArticleOpportunity } from '../types/newsjacking';

interface OpportunityCardProps {
  opportunity: ArticleOpportunity;
  onGenerate: (id: string) => void;
  onDismiss: (id: string) => void;
  onStartWriting: (id: string) => void;
  isGenerating?: boolean;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onGenerate,
  onDismiss,
  onStartWriting,
  isGenerating = false
}) => {
  const formatDate = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) {
      return 'Unknown date';
    }

    const date = new Date(timestamp);
    const now = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }

    const hoursAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hoursAgo < 1) return 'Just now';
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    if (hoursAgo < 168) return `${Math.floor(hoursAgo / 24)}d ago`; // 7 days
    return date.toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  console.log("🎨 OpportunityCard rendering:", opportunity.title, "has aiBrief:", !!opportunity.aiBrief);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* AI Brief Section */}
      {opportunity.aiBrief && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded">
                {opportunity.aiBrief.emotion}
              </span>
            </div>
            <button
              onClick={() => onStartWriting(opportunity.id)}
              className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-purple-700 transition-colors"
            >
              <FileText className="w-3 h-3" />
              <span>Keep Writing</span>
            </button>
          </div>

          <div className="mb-3">
            <p className="text-base font-semibold text-purple-900 leading-relaxed">
              {opportunity.aiBrief.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-purple-700 leading-relaxed">
              {opportunity.aiBrief.brief}
            </p>
          </div>
        </div>
      )}

      {/* Article Info Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-800 mb-1 leading-tight hover:text-blue-600 transition-colors"
            title="Click to open original article"
          >
            {opportunity.title}
          </a>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1" title={`Published: ${formatDate(opportunity.publishedAt)}`}>
              <Clock className="w-3 h-3" />
              <span>{formatDate(opportunity.publishedAt)}</span>
            </div>
            {opportunity.isTrending && (
              <div className="flex items-center gap-1 text-green-600" title="This article is trending (published recently)">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">Trending</span>
              </div>
            )}
            <span
              className="text-xs text-gray-500"
              title={`Source: ${opportunity.source}`}
            >
              {opportunity.source}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDismiss(opportunity.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Dismiss opportunity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 line-clamp-2" title="Article summary">
          {opportunity.summary || 'No summary available'}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600" title="How relevant this article is to your brand and target audience">
            Relevance Score
          </span>
          <span className="font-medium">{Math.round(opportunity.dynamicScore * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getScoreColor(opportunity.dynamicScore)}`}
            style={{ width: `${opportunity.dynamicScore * 100}%` }}
          />
        </div>
      </div>

      {opportunity.keywords && opportunity.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {opportunity.keywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
            >
              {keyword}
            </span>
          ))}
          {opportunity.keywords.length > 3 && (
            <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded">
              +{opportunity.keywords.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!opportunity.aiBrief && (
          <button
            onClick={() => onGenerate(opportunity.id)}
            disabled={isGenerating}
            className="flex items-center gap-2 flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
          >
            {isGenerating ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                <span>Generate Article</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default OpportunityCard;