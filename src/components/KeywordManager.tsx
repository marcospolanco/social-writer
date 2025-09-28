import React from 'react';
import { Plus, X, Settings } from 'lucide-react';
import { Keyword } from '../types/newsjacking';

interface KeywordManagerProps {
  keywords: Keyword[];
  onKeywordsChange: (keywords: Keyword[]) => void;
  isProcessing?: boolean;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({
  keywords,
  onKeywordsChange,
  isProcessing = false
}) => {

  const handleKeywordToggle = (index: number) => {
    const updatedKeywords = keywords.map((keyword, i) =>
      i === index ? { ...keyword, isActive: !keyword.isActive } : keyword
    );
    onKeywordsChange(updatedKeywords);
  };

  const handleKeywordPreferenceChange = (index: number, preference: number) => {
    const updatedKeywords = keywords.map((keyword, i) =>
      i === index ? { ...keyword, userPreference: preference } : keyword
    );
    onKeywordsChange(updatedKeywords);
  };

  const getCategoryColor = (category: Keyword['category']) => {
    switch (category) {
      case 'industry': return 'bg-blue-100 text-blue-800';
      case 'values': return 'bg-green-100 text-green-800';
      case 'products': return 'bg-purple-100 text-purple-800';
      case 'competitors': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeKeywordsCount = keywords.filter(k => k.isActive).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Brand Keywords</h3>
        <p className="text-sm text-gray-600">
          {activeKeywordsCount} active {activeKeywordsCount === 1 ? 'keyword' : 'keywords'} • Searched every 6 hours
        </p>
      </div>

      {keywords.length > 0 && (
        <div className="space-y-3">
          {keywords.map((keyword, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => handleKeywordToggle(index)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    keyword.isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {keyword.isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{keyword.term}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(keyword.category)}`}>
                      {keyword.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-600">Weight: {(keyword.weight * keyword.userPreference).toFixed(2)}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">Preference:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={keyword.userPreference}
                        onChange={(e) => handleKeywordPreferenceChange(index, parseFloat(e.target.value))}
                        className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={!keyword.isActive}
                      />
                      <span className="text-xs text-gray-600 w-8">{keyword.userPreference.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {keywords.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No keywords yet.</p>
        </div>
      )}
    </div>
  );
};

export default KeywordManager;