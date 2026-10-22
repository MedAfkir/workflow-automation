import { useEffect } from 'react';

import { ClosingCta } from '../components/ClosingCta';
import { CommandSurfaceHero } from '../components/CommandSurfaceHero';
import { Substance } from '../components/Substance';
import { TheLoop } from '../components/TheLoop';

export function LandingPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'workflow platform - workflows in YAML';

    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-cmd-bg font-mono text-cmd-fg">
      <a
        href="#main"
        className="sr-only rounded-md bg-cmd-accent px-3 py-2 font-mono text-sm text-cmd-bg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      <main id="main">
        <CommandSurfaceHero />
        <TheLoop />
        <Substance />
        <ClosingCta />
      </main>
    </div>
  );
}
