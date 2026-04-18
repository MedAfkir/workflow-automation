import { Construction } from 'lucide-react';
interface StubPageProps {
  title: string;
  description?: string;
}
export function StubPage({
  title,
  description
}: StubPageProps) {
  return <div className="flex h-full flex-col bg-cmd-bg font-mono">
      <header className="flex h-16 items-center border-b border-cmd-line bg-cmd-raised px-6">
        <h1 className="font-mono text-[15px] font-semibold text-cmd-fg">
          {title}
        </h1>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
            <Construction className="h-4 w-4 text-cmd-fg-mute" aria-hidden />
          </div>
          <div className="font-mono text-[14px] text-cmd-fg-dim">
            {title} page - coming next
          </div>
          {description && <p className="mt-2 font-mono text-[12px] leading-relaxed text-cmd-fg-mute">
              {description}
            </p>}
        </div>
      </div>
    </div>;
}
