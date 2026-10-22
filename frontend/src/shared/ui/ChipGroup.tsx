import { cn } from '@/shared/lib/cn';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  options: readonly ChipOption<T>[];
  isActive: (value: T) => boolean;
  onSelect: (value: T) => void;
  label?: string;
}

export function ChipGroup<T extends string>({
  options,
  isActive,
  onSelect,
  label,
}: ChipGroupProps<T>) {
  return (
    <div className="flex items-center gap-1">
      {label && (
        <span className="mr-1 font-mono text-2xs uppercase tracking-[0.12em] text-cmd-fg-mute">
          {label}
        </span>
      )}
      {options.map(({ value, label: chipLabel }) => {
        const active = isActive(value);

        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(value)}
            className={cn(
              'whitespace-nowrap rounded-md border px-2.5 py-0.5 font-mono text-xs outline-none transition-colors',
              'focus-visible:ring-2 focus-visible:ring-cmd-accent',
              active
                ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent'
                : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim',
            )}
          >
            {chipLabel}
          </button>
        );
      })}
    </div>
  );
}
