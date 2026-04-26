import { useMemo } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, type Edge, type Node } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { TaskNode, type TaskNodeData } from './TaskNode';
import type { TaskRun } from '@/lib/types';
const NODE_WIDTH = 200;
const NODE_HEIGHT = 64;
interface DAGCanvasProps {
  taskRuns: TaskRun[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}
const nodeTypes = {
  task: TaskNode
};
export function DAGCanvas({
  taskRuns,
  selectedTaskId,
  onSelectTask
}: DAGCanvasProps) {
  const {
    nodes,
    edges
  } = useMemo(() => buildGraph(taskRuns, selectedTaskId), [taskRuns, selectedTaskId]);
  return <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{
    padding: 0.2
  }} proOptions={{
    hideAttribution: true
  }} nodesDraggable={false} nodesConnectable={false} elementsSelectable onNodeClick={(_, node) => onSelectTask(node.id)} onPaneClick={() => onSelectTask(null)} defaultEdgeOptions={{
    type: 'smoothstep',
    animated: false
  }}>
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="oklch(0.305 0.010 195)" />
      <Controls showInteractive={false} />
    </ReactFlow>;
}
function buildGraph(taskRuns: TaskRun[], selectedTaskId: string | null): {
  nodes: Node<TaskNodeData>[];
  edges: Edge[];
} {
  const rootRuns = taskRuns.filter(t => t.parentTaskRunId === null);
  const byTaskId = new Map(rootRuns.map(t => [t.taskId, t]));
  const sorted = [...rootRuns].sort((a, b) => a.sequence - b.sequence);
  const implicitPredecessor = new Map<string, string | null>();
  let prev: string | null = null;
  for (const t of sorted) {
    implicitPredecessor.set(t.taskId, prev);
    prev = t.taskId;
  }
  const edges: Edge[] = [];
  for (const t of rootRuns) {
    if (t.explicitDependencies && t.dependsOn.length > 0) {
      for (const dep of t.dependsOn) {
        edges.push({
          id: `${dep}->${t.taskId}`,
          source: dep,
          target: t.taskId,
          className: edgeClass(byTaskId.get(dep)?.state)
        });
      }
    } else if (!t.explicitDependencies) {
      const implicit = implicitPredecessor.get(t.taskId);
      if (implicit) {
        edges.push({
          id: `${implicit}->${t.taskId}`,
          source: implicit,
          target: t.taskId,
          className: `dashed ${edgeClass(byTaskId.get(implicit)?.state)}`
        });
      }
    }
  }
  const positions = layout(rootRuns, edges);
  const nodes: Node<TaskNodeData>[] = rootRuns.map(t => ({
    id: t.taskId,
    type: 'task',
    position: positions.get(t.taskId) ?? {
      x: 0,
      y: 0
    },
    data: {
      taskRun: t,
      isSelected: t.taskId === selectedTaskId
    }
  }));
  return {
    nodes,
    edges
  };
}
function edgeClass(state: string | undefined): string {
  switch (state) {
    case 'SUCCESS':
      return 'success';
    case 'RUNNING':
      return 'running';
    case 'FAILED':
      return 'failed';
    default:
      return '';
  }
}
function layout(runs: TaskRun[], edges: Edge[]): Map<string, {
  x: number;
  y: number;
}> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    nodesep: 50,
    ranksep: 70
  });
  for (const t of runs) {
    g.setNode(t.taskId, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    });
  }
  for (const e of edges) {
    g.setEdge(e.source, e.target);
  }
  dagre.layout(g);
  const out = new Map<string, {
    x: number;
    y: number;
  }>();
  for (const t of runs) {
    const n = g.node(t.taskId);
    out.set(t.taskId, {
      x: n.x - NODE_WIDTH / 2,
      y: n.y - NODE_HEIGHT / 2
    });
  }
  return out;
}
