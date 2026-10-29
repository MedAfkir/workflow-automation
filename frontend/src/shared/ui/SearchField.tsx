import { Search, X } from 'lucide-react';
import type { RefObject } from 'react';

import { cn } from '@/shared/lib/cn';

import { Kbd } from './Kbd';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  inputRef,
  className,
}: SearchFieldProps) {
  return (
    <div
      className={cn(
        'group flex w-72 items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-bg px-2 py-1',
        'focus-within:border-cmd-accent-dim',
        className,
      )}
    >
      <Search className="h-3 w-3 shrink-0 text-cmd-fg-mute" aria-hidden />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Escape' || e.defaultPrevented) return;
          e.preventDefault();
          if (value) onChange('');
          e.currentTarget.blur();
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="min-w-0 flex-1 bg-transparent font-mono text-sm text-cmd-fg outline-none placeholder:text-cmd-fg-mute"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear filter"
          className="text-cmd-fg-mute outline-none hover:text-cmd-fg-dim focus-visible:text-cmd-fg"
        >
          <X className="h-3 w-3" />
        </button>
      ) : (
        <Kbd className="group-focus-within:opacity-0" aria-hidden>
          /
        </Kbd>
      )}
    </div>
  );
}
