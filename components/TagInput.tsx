import React, { useState, useRef, useEffect } from 'react';

interface TagInputProps {
  label: string;
  tags: string[];
  onTagAdd: (newTag: string) => void;
  onTagRemove: (index: number) => void;
  onTagUpdate: (index: number, newTag: string) => void;
  placeholder: string;
}

export const TagInput: React.FC<TagInputProps> = ({ label, tags, onTagAdd, onTagRemove, onTagUpdate, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddTag = () => {
    const newTag = inputValue.trim();
    if (newTag) {
      onTagAdd(newTag);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditingValue(tags[index]);
  };

  const handleEditSave = () => {
    if (editingIndex === null) return;
    
    const newTagName = editingValue.trim();
    const originalTagName = tags[editingIndex];

    if (newTagName && newTagName !== originalTagName) {
        onTagUpdate(editingIndex, newTagName);
    }
    
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
      setEditingIndex(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="mt-1 p-2 border border-slate-300 rounded-lg shadow-sm min-h-[80px] focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 bg-white">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <div key={`${tag}-${index}`} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full animate-fade-in group relative">
              {editingIndex === index ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={handleEditSave}
                  onKeyDown={handleEditKeyDown}
                  className="bg-transparent text-blue-800 outline-none p-0 m-0"
                  style={{ minWidth: '50px', width: `${editingValue.length + 2}ch` }}
                />
              ) : (
                <span onDoubleClick={() => handleEditStart(index)} className="cursor-pointer" title="Nhấp đúp để sửa">
                  {tag}
                </span>
              )}
              <button
                type="button"
                onClick={() => onTagRemove(index)}
                className="ml-2 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                aria-label={`Xóa ${tag}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="block w-full border-0 focus:ring-0 sm:text-sm p-1 placeholder-slate-400 bg-transparent"
            />
            <button
                type="button"
                onClick={handleAddTag}
                className="ml-2 flex-shrink-0 bg-blue-600 text-white text-sm font-bold py-1 px-3 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
                disabled={!inputValue.trim()}
            >
                Thêm
            </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1 text-right">Mẹo: Nhấp đúp vào một mục để chỉnh sửa.</p>
    </div>
  );
};
