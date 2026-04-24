import type { MapEdge, MapNode, RelationshipTypeId } from "./types";

export function searchNodes(nodes: MapNode[], query: string): MapNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nodes;

  return nodes.filter((node) => {
    const haystack = [node.name, node.subtitle, node.note, ...(node.tags ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function filterEdgesByType(
  edges: MapEdge[],
  visibleTypes: Set<RelationshipTypeId>,
): MapEdge[] {
  return edges.filter((edge) => visibleTypes.has(edge.type));
}
