'use client';

import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Sync value from props if it changes externally (e.g. when clearing the form)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: 'var(--surface)', color: 'var(--text)' }}>
      <div style={{ 
        display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--border)', 
        background: 'var(--surface-hover)', flexWrap: 'wrap', alignItems: 'center' 
      }}>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('undo')} title="Undo"><Undo size={14} /></button>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('redo')} title="Redo"><Redo size={14} /></button>
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('bold')} title="Bold"><Bold size={14} /></button>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('italic')} title="Italic"><Italic size={14} /></button>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('underline')} title="Underline"><Underline size={14} /></button>
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('justifyLeft')} title="Align Left"><AlignLeft size={14} /></button>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('justifyCenter')} title="Align Center"><AlignCenter size={14} /></button>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('justifyRight')} title="Align Right"><AlignRight size={14} /></button>
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('insertUnorderedList')} title="Bullet List"><List size={14} /></button>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => exec('insertOrderedList')} title="Numbered List"><ListOrdered size={14} /></button>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ padding: 12, minHeight, outline: 'none', fontSize: 14, resize: 'vertical', overflow: 'auto' }}
      />
      {value.length === 0 && placeholder && (
        <div style={{ position: 'absolute', pointerEvents: 'none', color: 'var(--text-muted)', marginTop: -minHeight + 12, paddingLeft: 12, fontSize: 14 }}>
          {placeholder}
        </div>
      )}
    </div>
  );
}
