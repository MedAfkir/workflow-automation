import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
interface SecretValueFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  invalid?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}
export const SecretValueField = forwardRef<HTMLInputElement, SecretValueFieldProps>(function SecretValueField({
  id,
  value,
  onChange,
  onEnter,
  invalid,
  autoFocus,
  placeholder
}, ref) {
  const [reveal, setReveal] = useState(false);
  return <div className={cn('flex items-center gap-1.5 rounded-md border bg-cmd-bg px-2.5 py-1.5', invalid ? 'border-run-failed' : 'border-cmd-line focus-within:border-cmd-accent-dim')}>
      <input ref={ref} id={id} type={reveal ? 'text' : 'password'} autoComplete="off" autoFocus={autoFocus} spellCheck={false} value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter?.();
      }
    }} placeholder={placeholder} className={cn('min-w-0 flex-1 bg-transparent outline-none', 'font-mono text-[12px] text-cmd-fg placeholder:text-cmd-fg-mute')} />
      <button type="button" onClick={() => setReveal(r => !r)} aria-label={reveal ? 'Hide value' : 'Reveal value'} aria-pressed={reveal} className={cn('shrink-0 rounded p-0.5 text-cmd-fg-mute outline-none transition-colors', 'hover:text-cmd-fg-dim focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
        {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>;
});
