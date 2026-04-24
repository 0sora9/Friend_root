import { Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { filterEdgesByType, searchNodes } from "../domain/filtering";
import type { RelationshipMap, RelationshipTypeId } from "../domain/types";
import { NodeCard } from "./NodeCard";
import { RelationshipEdge } from "./RelationshipEdge";
import type { Selection } from "./Sidebar";

interface RelationshipCanvasProps {
  map: RelationshipMap;
  searchQuery: string;
  visibleTypes: Set<RelationshipTypeId>;
  selected: Selection;
  onSelect: (selection: Selection) => void;
}

interface DragStart {
  pointerId: number;
  x: number;
  y: number;
  panX: number;
  panY: number;
}

const INITIAL_PAN = { x: -72, y: 14 };
const INITIAL_ZOOM = 0.62;

export function RelationshipCanvas({
  map,
  searchQuery,
  visibleTypes,
  selected,
  onSelect,
}: RelationshipCanvasProps) {
  const [pan, setPan] = useState(INITIAL_PAN);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const dragStart = useRef<DragStart | null>(null);

  const trimmedSearch = searchQuery.trim();
  const matchingNodeIds = useMemo(
    () => new Set(searchNodes(map.nodes, searchQuery).map((node) => node.id)),
    [map.nodes, searchQuery],
  );
  const visibleEdges = useMemo(
    () => filterEdgesByType(map.edges, visibleTypes),
    [map.edges, visibleTypes],
  );
  const nodeById = useMemo(
    () => new Map(map.nodes.map((node) => [node.id, node])),
    [map.nodes],
  );
  const selectedConnections = useMemo(() => {
    if (selected?.kind !== "node") return new Set<string>();

    return new Set(
      map.edges
        .filter((edge) => edge.from === selected.id || edge.to === selected.id)
        .flatMap((edge) => [edge.id, edge.from, edge.to]),
    );
  }, [map.edges, selected]);

  const maxX = Math.max(...map.nodes.map((node) => node.x), 1800) + 240;
  const maxY = Math.max(...map.nodes.map((node) => node.y), 900) + 220;

  function updateZoom(delta: number) {
    setZoom((current) => Math.min(1.45, Math.max(0.45, current + delta)));
  }

  return (
    <section
      className="canvas-shell"
      onWheel={(event) => {
        event.preventDefault();
        updateZoom(-event.deltaY * 0.001);
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const target = event.target as HTMLElement;
        if (target.closest("button, input, .relationship-edge")) return;

        dragStart.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          panX: pan.x,
          panY: pan.y,
        };
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Synthetic pointer events used by test tools may not have an active pointer.
        }
      }}
      onPointerMove={(event) => {
        if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) {
          return;
        }

        setPan({
          x: dragStart.current.panX + event.clientX - dragStart.current.x,
          y: dragStart.current.panY + event.clientY - dragStart.current.y,
        });
      }}
      onPointerUp={(event) => {
        if (dragStart.current?.pointerId === event.pointerId) {
          dragStart.current = null;
        }
      }}
    >
      <div className="canvas-toolbar" aria-label="Canvas controls">
        <button
          aria-label="Zoom in"
          title="Zoom in"
          type="button"
          onClick={() => updateZoom(0.1)}
        >
          <Plus size={18} />
        </button>
        <button
          aria-label="Zoom out"
          title="Zoom out"
          type="button"
          onClick={() => updateZoom(-0.1)}
        >
          <Minus size={18} />
        </button>
        <button
          aria-label="Reset view"
          title="Reset view"
          type="button"
          onClick={() => {
            setZoom(INITIAL_ZOOM);
            setPan(INITIAL_PAN);
          }}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div
        className="canvas-stage"
        style={{
          height: maxY,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: maxX,
        }}
      >
        <svg className="edge-layer" height={maxY} width={maxX}>
          {visibleEdges.map((edge) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) return null;

            const selectedEdge = selected?.kind === "edge" && selected.id === edge.id;
            const connectedToSelectedNode =
              selected?.kind === "node" && selectedConnections.has(edge.id);
            const dimmed =
              Boolean(trimmedSearch) &&
              (!matchingNodeIds.has(edge.from) || !matchingNodeIds.has(edge.to));

            return (
              <RelationshipEdge
                dimmed={dimmed}
                edge={edge}
                from={{ x: from.x + 72, y: from.y + 72 }}
                key={edge.id}
                selected={selectedEdge || connectedToSelectedNode}
                to={{ x: to.x + 72, y: to.y + 72 }}
                onSelect={(edgeId) => onSelect({ kind: "edge", id: edgeId })}
              />
            );
          })}
        </svg>

        <div className="node-layer">
          {map.nodes.map((node) => {
            const selectedNode = selected?.kind === "node" && selected.id === node.id;
            const connected =
              selected?.kind === "node" && selectedConnections.has(node.id);
            const dimmed =
              (Boolean(trimmedSearch) && !matchingNodeIds.has(node.id)) ||
              (selected?.kind === "node" && !selectedNode && !connected);

            return (
              <NodeCard
                dimmed={dimmed}
                key={node.id}
                node={node}
                selected={selectedNode}
                onSelect={(nodeId) => onSelect({ kind: "node", id: nodeId })}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
