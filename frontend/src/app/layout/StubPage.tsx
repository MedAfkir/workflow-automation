import { Construction } from 'lucide-react';

import { PageHeader } from '@/shared/ui/PageHeader';

interface StubPageProps {
  title: string;
  description?: string;
}

export function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="flex h-full flex-col bg-cmd-bg font-mono">
      <PageHeader title={title} />
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
            <Construction className="h-4 w-4 text-cmd-fg-mute" aria-hidden />
          </div>
          <div className="font-mono text-md text-cmd-fg-dim">{title} page - coming next</div>
          {description && (
            <p className="mt-2 font-mono text-sm leading-relaxed text-cmd-fg-mute">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
