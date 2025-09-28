import React, { useState } from 'react';
import { Brain, Lightbulb, Sparkles, RefreshCw } from 'lucide-react';
import { generateAIBrief } from '../services/convexNewsjacking';

interface AIBriefCardProps {
  opportunity: any;
  onGenerateArticle: (id: string) => void;
}

const ENGAGEMENT_EMOTIONS = [
  'Curiosity',
  'Joy/Happiness',
  'Surprise',
  'Empathy/Compassion',
  'Excitement',
  'Pride',
  'Amusement/Humor',
  'Nostalgia'
];

const AIBriefCard: React.FC<AIBriefCardProps> = ({ opportunity, onGenerateArticle }) => {
  const [selectedEmotion, setSelectedEmotion] = useState('Curiosity');
  const [aiBrief, setAiBrief] = useState<{ title: string; brief: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBrief = async () => {
    setIsGenerating(true);
    try {
      // Get the user's Gemini API key and brand guide from localStorage
      const geminiApiKey = localStorage.getItem('gemini_api_key');
      const brandGuide = localStorage.getItem('brand_guide');

      if (!geminiApiKey || !brandGuide) {
        alert('Please configure your Gemini API key and brand guide in the main application settings.');
        return;
      }

      const brief = await generateAIBrief(
        opportunity,
        brandGuide,
        selectedEmotion,
        geminiApiKey
      );
      setAiBrief(brief);
    } catch (error) {
      console.error('Error generating AI brief:', error);
      alert('Failed to generate AI brief. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800">AI Content Strategy</h3>
      </div>

      {/* Emotion Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Engagement Emotion:
        </label>
        <select
          value={selectedEmotion}
          onChange={(e) => setSelectedEmotion(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {ENGAGEMENT_EMOTIONS.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Brief Button */}
      <button
        onClick={handleGenerateBrief}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors mb-4"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Generating Brief...</span>
          </>
        ) : (
          <>
            <Lightbulb className="w-4 h-4" />
            <span>Generate AI Brief</span>
          </>
        )}
      </button>

      {/* AI Brief Result */}
      {aiBrief && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-gray-800">Generated Strategy</h4>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Suggested Title:</h5>
            <p className="text-sm text-gray-800 font-medium leading-relaxed p-3 bg-purple-50 rounded-lg">
              {aiBrief.title}
            </p>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Content Brief:</h5>
            <p className="text-sm text-gray-700 leading-relaxed p-3 bg-purple-50 rounded-lg">
              {aiBrief.brief}
            </p>
          </div>

          <button
            onClick={() => onGenerateArticle(opportunity.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            <span>Write Article</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AIBriefCard;