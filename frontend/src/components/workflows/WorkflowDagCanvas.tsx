import { useMemo } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, type Edge, type Node } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { GitBranch } from 'lucide-react';
import { WorkflowDagNode, type WorkflowNodeData } from './WorkflowDagNode';
import type { WorkflowTask } from '@/lib/types';
const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;
const nodeTypes = {
  task: WorkflowDagNode
};
interface WorkflowDagCanvasProps {
  tasks: WorkflowTask[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}
export function WorkflowDagCanvas({
  tasks,
  selectedTaskId,
  onSelectTask
}: WorkflowDagCanvasProps) {
  const {
    nodes,
    edges
  } = useMemo(() => buildGraph(tasks, selectedTaskId), [tasks, selectedTaskId]);
  if (tasks.length === 0) {
    return <div className="flex h-full items-center justify-center bg-cmd-bg">
        <div className="max-w-xs text-center">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
            <GitBranch className="h-4 w-4 text-cmd-fg-mute" aria-hidden />
          </div>
          <div className="font-mono text-[12px] text-cmd-fg-dim">
            No tasks in this definition
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-cmd-fg-mute">
            Switch to YAML to inspect the source.
          </p>
        </div>
      </div>;
  }
  return <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{
    padding: 0.24
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
function buildGraph(tasks: WorkflowTask[], selectedTaskId: string | null): {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
} {
  const ids = new Set(tasks.map(t => t.id));
  const implicitPredecessor = new Map<string, string | null>();
  let prev: string | null = null;
  for (const t of tasks) {
    implicitPredecessor.set(t.id, prev);
    prev = t.id;
  }
  const edges: Edge[] = [];
  for (const t of tasks) {
    if (t.explicitDependencies && t.dependsOn.length > 0) {
      for (const dep of t.dependsOn) {
        if (!ids.has(dep)) continue;
        edges.push({
          id: `${dep}->${t.id}`,
          source: dep,
          target: t.id
        });
      }
    } else {
      const implicit = implicitPredecessor.get(t.id);
      if (implicit) {
        edges.push({
          id: `${implicit}->${t.id}`,
          source: implicit,
          target: t.id,
          className: 'dashed'
        });
      }
    }
  }
  const positions = layout(tasks, edges);
  const nodes: Node<WorkflowNodeData>[] = tasks.map(t => ({
    id: t.id,
    type: 'task',
    position: positions.get(t.id) ?? {
      x: 0,
      y: 0
    },
    data: {
      task: t,
      isSelected: t.id === selectedTaskId
    }
  }));
  return {
    nodes,
    edges
  };
}
function layout(tasks: WorkflowTask[], edges: Edge[]): Map<string, {
  x: number;
  y: number;
}> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    nodesep: 48,
    ranksep: 64
  });
  for (const t of tasks) {
    g.setNode(t.id, {
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
  for (const t of tasks) {
    const n = g.node(t.id);
    out.set(t.id, {
      x: n.x - NODE_WIDTH / 2,
      y: n.y - NODE_HEIGHT / 2
    });
  }
  return out;
}
