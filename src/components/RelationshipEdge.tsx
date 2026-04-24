import { getEdgeLabelPoint, getEdgePath, type Point } from "../domain/edgePath";
import { RELATIONSHIP_TYPES } from "../domain/relationshipTypes";
import type { MapEdge } from "../domain/types";

interface RelationshipEdgeProps {
  edge: MapEdge;
  from: Point;
  to: Point;
  selected: boolean;
  dimmed: boolean;
  onSelect: (edgeId: string) => void;
}

export function RelationshipEdge({
  edge,
  from,
  to,
  selected,
  dimmed,
  onSelect,
}: RelationshipEdgeProps) {
  const definition = RELATIONSHIP_TYPES[edge.type];
  const labelPoint = getEdgeLabelPoint(from, to);
  const markerId = `arrow-${edge.id}`;
  const isBidirectional = edge.bidirectional ?? definition.bidirectionalDefault;
  const label = edge.label ?? definition.label;

  return (
    <g
      aria-label={label}
      className={`relationship-edge ${selected ? "is-selected" : ""} ${
        dimmed ? "is-dimmed" : ""
      }`}
      onClick={() => onSelect(edge.id)}
      role="button"
    >
      <defs>
        <marker
          id={markerId}
          markerHeight="10"
          markerWidth="10"
          orient="auto"
          refX="7"
          refY="3"
        >
          <path d="M0,0 L0,6 L8,3 z" fill={definition.color} />
        </marker>
      </defs>
      <path
        d={getEdgePath(from, to)}
        fill="none"
        markerEnd={`url(#${markerId})`}
        markerStart={isBidirectional ? `url(#${markerId})` : undefined}
        stroke={definition.color}
        strokeDasharray={definition.dashArray}
        strokeLinecap="round"
        strokeWidth={definition.strokeWidth}
      />
      <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" className="edge-label">
        {label}
      </text>
      <text
        className="edge-icon"
        fill={definition.color}
        textAnchor="middle"
        x={labelPoint.x}
        y={labelPoint.y - 24}
      >
        {definition.icon}
      </text>
    </g>
  );
}
