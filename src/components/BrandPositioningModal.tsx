import React, { useState, useRef } from 'react';
import { FileText, Upload, X, Eye, EyeOff } from 'lucide-react';

interface BrandPositioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  currentContent: string;
}

const BrandPositioningModal: React.FC<BrandPositioningModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentContent 
}) => {
  const [content, setContent] = useState(currentContent);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content.trim());
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClear = () => {
    setContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Brand Positioning Document</h2>
                <p className="text-sm text-gray-600">Upload or paste your brand guidelines to ensure consistent messaging</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
              {content && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
              <span className="text-sm text-gray-500">Supports: .txt, .md, .doc, .pdf (text only)</span>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Positioning Content
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {content.length} characters
                </span>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or type your brand positioning document here...

Include details like:
• Brand voice and tone
• Key messaging pillars
• Target audience
• Value propositions
• Brand personality traits
• Communication guidelines"
                className={`w-full px-3 py-2 border-none outline-none resize-none transition-all ${
                  isExpanded ? 'h-80' : 'h-32'
                }`}
              />
            </div>
          </div>

          {content && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800">
                <strong>How it works:</strong> Your brand positioning will be included in the AI analysis 
                to ensure your LinkedIn posts align with your brand voice, messaging, and positioning strategy.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Brand Positioning
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandPositioningModal;