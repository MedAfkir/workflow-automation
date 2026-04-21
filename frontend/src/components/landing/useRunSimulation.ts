import { useCallback, useEffect, useRef, useState } from 'react';
import { formatLogTimestamp } from '@/lib/utils';
import type { TaskRunState } from '@/lib/types';
import { IDLE_STATES, RUN_SCRIPT, type RunStep, type TaskId } from './demoWorkflow';
export interface SimLog {
  id: number;
  level: 'INFO' | 'WARN' | 'DEBUG';
  taskId: TaskId;
  message: string;
  ts: string;
}
export type SimPhase = 'idle' | 'running' | 'done';
interface SimState {
  phase: SimPhase;
  states: Record<TaskId, TaskRunState>;
  logs: SimLog[];
}
const finalStep: RunStep = RUN_SCRIPT[RUN_SCRIPT.length - 1];
function resolvedLogs(): SimLog[] {
  return RUN_SCRIPT.filter(s => s.log).map((s, i) => ({
    id: i,
    level: s.log!.level,
    taskId: s.log!.taskId,
    message: s.log!.message,
    ts: formatLogTimestamp(new Date())
  }));
}
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
export function useRunSimulation() {
  const reduced = usePrefersReducedMotion();
  const [sim, setSim] = useState<SimState>(() => reduced ? {
    phase: 'done',
    states: finalStep.states,
    logs: resolvedLogs()
  } : {
    phase: 'idle',
    states: {
      ...IDLE_STATES
    },
    logs: []
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  const reset = useCallback(() => {
    clear();
    setSim({
      phase: 'idle',
      states: {
        ...IDLE_STATES
      },
      logs: []
    });
  }, [clear]);
  const run = useCallback(() => {
    clear();
    if (reduced) {
      setSim({
        phase: 'done',
        states: finalStep.states,
        logs: resolvedLogs()
      });
      return;
    }
    setSim({
      phase: 'running',
      states: {
        ...IDLE_STATES
      },
      logs: []
    });
    let i = 0;
    const advance = () => {
      const step = RUN_SCRIPT[i];
      setSim(prev => ({
        phase: step.done ? 'done' : 'running',
        states: step.states,
        logs: step.log ? [...prev.logs, {
          id: prev.logs.length,
          level: step.log.level,
          taskId: step.log.taskId,
          message: step.log.message,
          ts: formatLogTimestamp(new Date())
        }] : prev.logs
      }));
      i += 1;
      if (i < RUN_SCRIPT.length) {
        timer.current = setTimeout(advance, step.dwell);
      }
    };
    advance();
  }, [clear, reduced]);
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, [reduced, run]);
  useEffect(() => clear, [clear]);
  return {
    ...sim,
    run,
    reset,
    reducedMotion: reduced
  };
}
