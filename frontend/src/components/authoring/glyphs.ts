import { Braces, Clock, Globe, GitFork, Hourglass, Repeat, ScrollText, type LucideIcon } from 'lucide-react';
export function glyphForType(type: string): LucideIcon {
  const leaf = (type.split('.').pop() ?? type).toLowerCase();
  if (leaf.includes('foreach')) return Repeat;
  if (leaf === 'if' || leaf.includes('branch')) return GitFork;
  if (leaf.includes('wait')) return Hourglass;
  if (leaf.includes('http')) return Globe;
  if (leaf.includes('log')) return ScrollText;
  if (leaf.includes('cron') || leaf.includes('schedule')) return Clock;
  return Braces;
}
