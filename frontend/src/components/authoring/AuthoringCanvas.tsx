import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Background, BackgroundVariant, Controls, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow, useUpdateNodeInternals, type Connection, type Edge, type Node } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { MousePointerClick } from 'lucide-react';
import { AuthoringNode, type AuthoringNodeData } from './AuthoringNode';
import { useAuthoringStore } from './store';
import { PLUGIN_DND_MIME } from './dnd';
import type { DraftTask } from '@/lib/authoring/types';
const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;
const nodeTypes = {
  task: AuthoringNode
};
interface AuthoringCanvasProps {
  invalidIds: Set<string>;
}
export function AuthoringCanvas({
  invalidIds
}: AuthoringCanvasProps) {
  return <ReactFlowProvider>
      <Flow invalidIds={invalidIds} />
    </ReactFlowProvider>;
}
function Flow({
  invalidIds
}: AuthoringCanvasProps) {
  const tasks = useAuthoringStore(s => s.tasks);
  const selectedId = useAuthoringStore(s => s.selectedId);
  const select = useAuthoringStore(s => s.select);
  const addTask = useAuthoringStore(s => s.addTask);
  const removeTask = useAuthoringStore(s => s.removeTask);
  const connect = useAuthoringStore(s => s.connect);
  const rf = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (el.clientHeight > 0 && el.clientWidth > 0) {
      setReady(true);
      return;
    }
    const ro = new ResizeObserver(() => {
      if (el.clientHeight > 0 && el.clientWidth > 0) setReady(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AuthoringNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const structureSig = useMemo(() => tasks.map(t => `${t.id}:${t.dependsOn.join('.')}`).join('|'), [tasks]);
  useEffect(() => {
    const built = buildGraph(tasks, selectedId, invalidIds, removeTask);
    setNodes(prev => built.nodes.map(n => {
      const old = prev.find(p => p.id === n.id);
      return old?.measured ? {
        ...n,
        measured: old.measured
      } : n;
    }));
    setEdges(built.edges);
  }, [structureSig, setNodes, setEdges]);
  useEffect(() => {
    setNodes(prev => prev.map(n => ({
      ...n,
      selected: n.id === selectedId,
      data: {
        ...n.data,
        selected: n.id === selectedId,
        invalid: invalidIds.has(n.id)
      }
    })));
  }, [selectedId, invalidIds, setNodes]);
  useEffect(() => {
    if (tasks.length === 0) return;
    const raf = requestAnimationFrame(() => {
      tasks.forEach(t => updateNodeInternals(t.id));
      rf.fitView({
        padding: 0.24,
        duration: 160,
        maxZoom: 1.1
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [structureSig, rf, updateNodeInternals]);
  const onConnect = useCallback((c: Connection) => {
    if (c.source && c.target) connect(c.source, c.target);
  }, [connect]);
  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData(PLUGIN_DND_MIME);
    if (type) addTask(type);
  }, [addTask]);
  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);
  return <div ref={wrapperRef} className="relative h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      {ready && <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{
      padding: 0.24,
      maxZoom: 1.1
    }} minZoom={0.3} maxZoom={1.6} proOptions={{
      hideAttribution: true
    }} nodesDraggable={false} nodesConnectable elementsSelectable deleteKeyCode={null} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, node) => select(node.id)} onPaneClick={() => select(null)} defaultEdgeOptions={{
      type: 'smoothstep',
      animated: false
    }}>
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="oklch(0.305 0.010 195)" />
        <Controls showInteractive={false} />
      </ReactFlow>}

      {tasks.length === 0 && <EmptyCanvas />}
    </div>;
}
function EmptyCanvas() {
  return <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="max-w-xs text-center">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
          <MousePointerClick className="h-4 w-4 text-cmd-fg-mute" aria-hidden />
        </div>
        <div className="font-mono text-[13px] text-cmd-fg-dim">
          Start the graph
        </div>
        <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
          Drag a plugin from the left onto the canvas, or click one to add
          it. Connect tasks by dragging from one handle to another.
        </p>
      </div>
    </div>;
}
function buildGraph(tasks: DraftTask[], selectedId: string | null, invalidIds: Set<string>, onDelete: (id: string) => void): {
  nodes: Node<AuthoringNodeData>[];
  edges: Edge[];
} {
  const ids = new Set(tasks.map(t => t.id));
  const implicitPrev = new Map<string, string | null>();
  let prev: string | null = null;
  for (const t of tasks) {
    implicitPrev.set(t.id, prev);
    prev = t.id;
  }
  const edges: Edge[] = [];
  for (const t of tasks) {
    if (t.dependsOn.length > 0) {
      for (const dep of t.dependsOn) {
        if (!ids.has(dep)) continue;
        edges.push({
          id: `${dep}->${t.id}`,
          source: dep,
          target: t.id
        });
      }
    } else {
      const implicit = implicitPrev.get(t.id);
      if (implicit) {
        edges.push({
          id: `${implicit}~>${t.id}`,
          source: implicit,
          target: t.id,
          className: 'dashed',
          selectable: false
        });
      }
    }
  }
  const positions = layout(tasks, edges);
  const nodes: Node<AuthoringNodeData>[] = tasks.map(t => {
    const branchCount = Object.values(t.children).reduce((n, kids) => n + kids.length, 0);
    return {
      id: t.id,
      type: 'task',
      position: positions.get(t.id) ?? {
        x: 0,
        y: 0
      },
      data: {
        task: t,
        selected: t.id === selectedId,
        invalid: invalidIds.has(t.id),
        branchCount,
        onDelete
      },
      selected: t.id === selectedId
    };
  });
  return {
    nodes,
    edges
  };
}
function layout(tasks: DraftTask[], edges: Edge[]): Map<string, {
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
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  }
  dagre.layout(g);
  const out = new Map<string, {
    x: number;
    y: number;
  }>();
  for (const t of tasks) {
    const n = g.node(t.id);
    if (n) out.set(t.id, {
      x: n.x - NODE_WIDTH / 2,
      y: n.y - NODE_HEIGHT / 2
    });
  }
  return out;
}
