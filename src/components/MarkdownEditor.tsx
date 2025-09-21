import React from 'react';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownEditorProps {
  value: string;
  onChange: (text: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const handleChange = (val: string | undefined) => {
    const text = val || '';
    onChange(text);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b bg-gray-50 text-sm text-gray-600">
        <span className="font-medium">Markdown Support:</span>
        <code className="px-2 py-1 bg-white border rounded text-xs">**bold**</code>
        <code className="px-2 py-1 bg-white border rounded text-xs">*italic*</code>
        <code className="px-2 py-1 bg-white border rounded text-xs"># heading</code>
        <code className="px-2 py-1 bg-white border rounded text-xs">- list</code>
      </div>
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={value}
          onChange={handleChange}
          data-color-mode="light"
          height={400}
          preview="edit"
          hideToolbar={false}
          toolbarHeight={60}
          textareaProps={{
            placeholder: 'Start writing your LinkedIn post here... Use markdown formatting like **bold** and *italic*. The AI will analyze your content in real-time and provide feedback.',
            style: {
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              resize: 'none'
            }
          }}
          style={{
            height: '100%',
            backgroundColor: 'white'
          }}
        />
      </div>
    </div>
  );
};

export default MarkdownEditor;