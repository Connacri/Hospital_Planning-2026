import React, { useState, useEffect, useRef } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  darkSurface?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  className = '',
  multiline = false,
  placeholder = '...',
  ariaLabel,
  darkSurface = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDraft(value);
      setIsEditing(false);
    } else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      commit();
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={(el) => {
            inputRef.current = el;
          }}
          value={draft}
          aria-label={ariaLabel || placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          rows={Math.max(2, draft.split('\n').length)}
          className={`w-full rounded px-1 py-0.5 text-center font-pdf outline-none ring-2 ${
            darkSurface
              ? 'bg-neutral-900 text-white ring-amber-400'
              : 'bg-amber-50 text-black ring-slate-900'
          } ${className}`}
        />
      );
    }
    return (
      <input
        ref={(el) => {
          inputRef.current = el;
        }}
        type="text"
        value={draft}
        aria-label={ariaLabel || placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`w-full min-w-[24px] rounded px-1 py-0.5 text-inherit font-pdf outline-none ring-2 ${
          darkSurface
            ? 'bg-neutral-900 text-white ring-amber-400'
            : 'bg-amber-50 text-black ring-slate-900'
        } ${className}`}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || value || placeholder}
      title="Cliquer pour modifier"
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      className={`inline-block cursor-pointer rounded-sm transition-colors duration-150 ${
        darkSurface
          ? 'hover:bg-white/20 focus-visible:ring-1 focus-visible:ring-amber-300'
          : 'hover:bg-amber-200/60 focus-visible:ring-1 focus-visible:ring-slate-900'
      } ${!value ? 'min-w-[32px] min-h-[18px] opacity-40' : ''} ${className}`}
    >
      {value ? (
        value.split('\n').map((line, i, arr) => (
          <React.Fragment key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </React.Fragment>
        ))
      ) : (
        <span className="no-print text-[10px] italic opacity-50">{placeholder}</span>
      )}
    </span>
  );
};
