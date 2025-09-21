import React, { useState, useEffect, useCallback } from 'react';
import MarkdownEditor from './components/MarkdownEditor';
import FeedbackPanel from './components/FeedbackPanel';
import ApiKeyModal from './components/ApiKeyModal';
import BrandPositioningModal from './components/BrandPositioningModal';
import { PostFeedback } from './types/feedback';
import { analyzePostWithGemini, improvePostWithGemini } from './services/geminiApi';
import { useDebounce } from './hooks/useDebounce';
import { PenTool, Settings, Sparkles, FileText, Zap } from 'lucide-react';

function App() {
  const [editorValue, setEditorValue] = useState('');
  const [previousText, setPreviousText] = useState('');
  const [feedback, setFeedback] = useState<PostFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [brandPositioning, setBrandPositioning] = useState('');
  const [showBrandModal, setShowBrandModal] = useState(false);
  
  const debouncedText = useDebounce(editorValue, 5000);

  // Load API key and brand positioning from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    const savedBrandPositioning = localStorage.getItem('brand-positioning');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    if (savedBrandPositioning) {
      setBrandPositioning(savedBrandPositioning);
    }
  }, []);

  // Analyze content when debounced text changes
  useEffect(() => {
    const analyzeContent = async () => {
      if (!apiKey || !debouncedText.trim() || debouncedText === previousText) {
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const result = await analyzePostWithGemini(debouncedText, apiKey, brandPositioning || undefined);
        setFeedback(result);
        setPreviousText(debouncedText);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
        setError(errorMessage);
        console.error('Analysis error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeContent();
  }, [debouncedText, apiKey, brandPositioning, previousText]);

  const handleApiKeySave = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini-api-key', newApiKey);
    setError(null);
    
    // Re-analyze current content with new API key if we have content
    if (editorValue.trim() && editorValue !== previousText) {
      setPreviousText(''); // Force re-analysis
    }
  }, [editorValue, previousText]);

  const handleBrandPositioningSave = useCallback((content: string) => {
    setBrandPositioning(content);
    localStorage.setItem('brand-positioning', content);
    setError(null);
    
    // Re-analyze current content with new brand positioning if we have content
    if (editorValue.trim() && editorValue !== previousText) {
      setPreviousText(''); // Force re-analysis
    }
  }, [editorValue, previousText]);

  const handleAutoImprove = useCallback(async () => {
    if (!apiKey || !feedback || !editorValue.trim()) {
      return;
    }

    setIsImproving(true);
    setError(null);
    
    try {
      const improvedText = await improvePostWithGemini(
        editorValue, 
        feedback, 
        apiKey, 
        brandPositioning || undefined
      );
      
      setEditorValue(improvedText);
      setPreviousText(''); // Force re-analysis of the improved content
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Auto-improvement failed';
      setError(errorMessage);
      console.error('Auto-improvement error:', err);
    } finally {
      setIsImproving(false);
    }
  }, [apiKey, feedback, editorValue, brandPositioning]);

  const hasApiKey = Boolean(apiKey.trim());
  const hasBrandPositioning = Boolean(brandPositioning.trim());
  const canAutoImprove = hasApiKey && feedback && editorValue.trim() && !isLoading && !isImproving;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PenTool className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">LinkedIn Writing Assistant</h1>
            <p className="text-sm text-gray-600">AI-powered real-time feedback for engaging posts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBrandModal(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              hasBrandPositioning
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <FileText className={`w-4 h-4 ${hasBrandPositioning ? 'text-purple-600' : 'text-gray-500'}`} />
            <span>{hasBrandPositioning ? 'Brand Guide Active' : 'Add Brand Guide'}</span>
            {hasBrandPositioning && (
              <div className="w-2 h-2 bg-purple-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              hasApiKey
                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {hasApiKey ? (
              <Sparkles className="w-4 h-4 text-green-600" />
            ) : (
              <Settings className="w-4 h-4 text-gray-500" />
            )}
            <span>{hasApiKey ? 'AI Active' : 'Set API Key'}</span>
            {hasApiKey && (
              <div className="w-2 h-2 bg-green-600 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="w-1/2 border-r bg-white">
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Write Your Post</h2>
              <p className="text-sm text-gray-600">
                {hasApiKey 
                  ? `AI analysis happens automatically every 5 seconds after you stop typing${hasBrandPositioning ? ' with brand alignment' : ''}`
                  : 'Add your API key to enable real-time feedback'
                }
              </p>
            </div>
            <MarkdownEditor
              value={editorValue}
              onChange={setEditorValue}
            />
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={handleAutoImprove}
                disabled={!canAutoImprove}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isImproving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Applying Improvements...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Auto Improve</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                {!hasApiKey 
                  ? 'Add API key to enable auto-improvement'
                  : !feedback
                  ? 'Write content and wait for AI analysis to enable auto-improvement'
                  : 'Apply AI suggestions to automatically enhance your post'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Panel */}
        <div className="w-1/2 bg-gray-50">
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b bg-white">
              <h2 className="text-lg font-semibold text-gray-800">Real-time Feedback</h2>
              <p className="text-sm text-gray-600">
                Get instant analysis based on LinkedIn best practices{hasBrandPositioning ? ' and your brand positioning' : ''}
              </p>
            </div>
            <FeedbackPanel
              feedback={feedback}
              isLoading={isLoading}
              hasApiKey={hasApiKey}
              error={error}
            />
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
        currentApiKey={apiKey}
      />

      {/* Brand Positioning Modal */}
      <BrandPositioningModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        onSave={handleBrandPositioningSave}
        currentContent={brandPositioning}
      />
    </div>
  );
}

export default App;