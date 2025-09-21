import React, { useState, useEffect, useCallback } from 'react';
import { Descendant } from 'slate';
import SlateEditor from './components/SlateEditor';
import FeedbackPanel from './components/FeedbackPanel';
import ApiKeyModal from './components/ApiKeyModal';
import { PostFeedback } from './types/feedback';
import { analyzePostWithGemini } from './services/geminiApi';
import { useDebounce } from './hooks/useDebounce';
import { PenTool, Settings, Sparkles } from 'lucide-react';

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

function App() {
  const [editorValue, setEditorValue] = useState<Descendant[]>(initialValue);
  const [currentText, setCurrentText] = useState('');
  const [previousText, setPreviousText] = useState('');
  const [feedback, setFeedback] = useState<PostFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  const debouncedText = useDebounce(currentText, 5000);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
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
        const result = await analyzePostWithGemini(debouncedText, apiKey);
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
  }, [debouncedText, apiKey, previousText]);

  const handleApiKeySave = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini-api-key', newApiKey);
    setError(null);
    
    // Re-analyze current content with new API key if we have content
    if (currentText.trim() && currentText !== previousText) {
      setPreviousText(''); // Force re-analysis
    }
  }, [currentText, previousText]);

  const handleTextChange = useCallback((text: string) => {
    setCurrentText(text);
  }, []);

  const hasApiKey = Boolean(apiKey.trim());

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
          {hasApiKey && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Sparkles className="w-4 h-4" />
              <span>AI Active</span>
            </div>
          )}
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>{hasApiKey ? 'Update' : 'Set'} API Key</span>
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
                  ? 'AI analysis happens automatically every 5 seconds after you stop typing'
                  : 'Add your API key to enable real-time feedback'
                }
              </p>
            </div>
            <SlateEditor
              value={editorValue}
              onChange={setEditorValue}
              onTextChange={handleTextChange}
            />
          </div>
        </div>

        {/* Feedback Panel */}
        <div className="w-1/2 bg-gray-50">
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b bg-white">
              <h2 className="text-lg font-semibold text-gray-800">Real-time Feedback</h2>
              <p className="text-sm text-gray-600">
                Get instant analysis based on LinkedIn best practices
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
    </div>
  );
}

export default App;