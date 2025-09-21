import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { createEditor, Descendant, Editor, Transforms, Text } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';

interface SlateEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  onTextChange: (text: string) => void;
}

const SlateEditor: React.FC<SlateEditorProps> = ({ value, onChange, onTextChange }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const renderLeaf = useCallback((props: any) => {
    return <Leaf {...props} />;
  }, []);

  const handleChange = useCallback((newValue: Descendant[]) => {
    onChange(newValue);
    
    // Extract plain text for API calls
    const plainText = newValue
      .map(n => Node.string(n))
      .join('\n');
    onTextChange(plainText);
  }, [onChange, onTextChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b': {
          event.preventDefault();
          CustomEditor.toggleBoldMark(editor);
          break;
        }
        case 'i': {
          event.preventDefault();
          CustomEditor.toggleItalicMark(editor);
          break;
        }
      }
    }
  }, [editor]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b bg-gray-50 text-sm text-gray-600">
        <span className="font-medium">Formatting:</span>
        <kbd className="px-2 py-1 bg-white border rounded text-xs">Ctrl+B</kbd>
        <span>Bold</span>
        <kbd className="px-2 py-1 bg-white border rounded text-xs">Ctrl+I</kbd>
        <span>Italic</span>
      </div>
      <div className="flex-1 p-6">
        <Slate editor={editor} initialValue={value} onValueChange={handleChange}>
          <Editable
            className="h-full min-h-[300px] text-gray-800 leading-relaxed text-lg focus:outline-none"
            placeholder="Start writing your LinkedIn post here... The AI will analyze your content in real-time and provide feedback."
            renderLeaf={renderLeaf}
            onKeyDown={handleKeyDown}
            spellCheck
          />
        </Slate>
      </div>
    </div>
  );
};

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  return <span {...attributes}>{children}</span>;
};

const CustomEditor = {
  isBoldMarkActive(editor: ReactEditor) {
    const marks = Editor.marks(editor);
    return marks ? marks.bold === true : false;
  },

  isItalicMarkActive(editor: ReactEditor) {
    const marks = Editor.marks(editor);
    return marks ? marks.italic === true : false;
  },

  toggleBoldMark(editor: ReactEditor) {
    const isActive = CustomEditor.isBoldMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'bold');
    } else {
      Editor.addMark(editor, 'bold', true);
    }
  },

  toggleItalicMark(editor: ReactEditor) {
    const isActive = CustomEditor.isItalicMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'italic');
    } else {
      Editor.addMark(editor, 'italic', true);
    }
  },
};

// Helper to extract text from Slate nodes
const Node = {
  string(node: any): string {
    if (Text.isText(node)) {
      return node.text;
    }
    return node.children?.map((n: any) => Node.string(n)).join('') || '';
  }
};

export default SlateEditor;