import { ArrowDown, ArrowUp } from 'lucide-react';
import { Fragment } from 'react';

import { Kbd } from '@/shared/ui/Kbd';

import { type Combo, keyName } from './shortcuts';

const ARROWS: Partial<Record<string, typeof ArrowUp>> = {
  up: ArrowUp,
  down: ArrowDown,
};

function Key({ name }: { name: string }) {
  const Arrow = ARROWS[name];

  return (
    <Kbd variant="cap">
      {Arrow ? (
        <>
          <Arrow className="h-3 w-3" aria-hidden />
          <span className="sr-only">{keyName(name)} arrow</span>
        </>
      ) : (
        keyName(name)
      )}
    </Kbd>
  );
}

export function ShortcutKeys({ keys }: { keys: readonly Combo[] }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {keys.map((combo, i) => (
        <Fragment key={combo.join('+')}>
          {i > 0 && <span className="font-mono text-2xs text-cmd-fg-mute">or</span>}
          <span className="flex items-center gap-0.5">
            {combo.map((k) => (
              <Key key={k} name={k} />
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
