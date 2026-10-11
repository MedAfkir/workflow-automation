import { useEffect, useRef, useState } from 'react';
import type { LogLevel, LogLine } from '@/lib/types';
interface LogEventWire {
  id: number;
  executionId: string;
  taskRunId: string | null;
  level: string;
  message: string;
  loggedAt: string;
}
const LEVEL_MAP: Record<string, LogLevel> = {
  TRACE: 'DEBUG',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  WARNING: 'WARN',
  ERROR: 'ERROR'
};
function toLevel(raw: string): LogLevel {
  return LEVEL_MAP[(raw ?? '').toUpperCase()] ?? 'INFO';
}
export interface UseExecutionLogsResult {
  logs: LogLine[];
  connected: boolean;
}
export function useExecutionLogs(executionId: string | undefined, opts: {
  enabled?: boolean;
  taskIdByRunId?: ReadonlyMap<string, string>;
} = {}): UseExecutionLogsResult {
  const {
    enabled = true,
    taskIdByRunId
  } = opts;
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  const taskMapRef = useRef(taskIdByRunId);
  taskMapRef.current = taskIdByRunId;
  useEffect(() => {
    if (!executionId || !enabled) return;
    const seen = new Set<number>();
    setLogs([]);
    setConnected(false);
    const source = new EventSource(`/api/v1/executions/${executionId}/logs/stream`);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    const onLog = (event: MessageEvent<string>) => {
      let wire: LogEventWire;
      try {
        wire = JSON.parse(event.data) as LogEventWire;
      } catch {
        return;
      }
      if (seen.has(wire.id)) return;
      seen.add(wire.id);
      const line: LogLine = {
        id: String(wire.id),
        taskRunId: wire.taskRunId,
        taskId: wire.taskRunId ? taskMapRef.current?.get(wire.taskRunId) ?? null : null,
        level: toLevel(wire.level),
        message: wire.message,
        timestamp: wire.loggedAt
      };
      setLogs(prev => [...prev, line]);
    };
    source.addEventListener('log', onLog as EventListener);
    return () => {
      source.removeEventListener('log', onLog as EventListener);
      source.close();
    };
  }, [executionId, enabled]);
  return {
    logs,
    connected
  };
}
