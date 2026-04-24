import { relationshipTypeIds } from "./relationshipTypes";
import type {
  MapEdge,
  MapNode,
  RelationshipMap,
  RelationshipTypeId,
} from "./types";

export type ParseResult =
  | { ok: true; data: RelationshipMap }
  | { ok: false; error: string };

type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeTags(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function parseNode(value: unknown): ValidationResult<MapNode> {
  if (!isRecord(value)) {
    return { ok: false, error: "Each node must be an object." };
  }

  const id = value.id;
  if (!isString(id)) {
    return { ok: false, error: "A node is missing required id." };
  }
  if (!isString(value.name)) {
    return { ok: false, error: `Node ${id} is missing required name.` };
  }
  if (!isString(value.imageUrl)) {
    return { ok: false, error: `Node ${id} is missing required imageUrl.` };
  }
  if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
    return {
      ok: false,
      error: `Node ${id} is missing numeric x/y coordinates.`,
    };
  }

  return {
    ok: true,
    data: {
      id,
      name: value.name,
      imageUrl: value.imageUrl,
      x: value.x,
      y: value.y,
      subtitle: typeof value.subtitle === "string" ? value.subtitle : undefined,
      tags: normalizeTags(value.tags),
      color: typeof value.color === "string" ? value.color : undefined,
      note: typeof value.note === "string" ? value.note : undefined,
    },
  };
}

function parseEdge(value: unknown): ValidationResult<MapEdge> {
  if (!isRecord(value)) {
    return { ok: false, error: "Each edge must be an object." };
  }

  const id = value.id;
  if (!isString(id)) {
    return { ok: false, error: "An edge is missing required id." };
  }
  if (!isString(value.from)) {
    return { ok: false, error: `Edge ${id} is missing required from.` };
  }
  if (!isString(value.to)) {
    return { ok: false, error: `Edge ${id} is missing required to.` };
  }
  if (!isString(value.type)) {
    return { ok: false, error: `Edge ${id} is missing required type.` };
  }
  if (!relationshipTypeIds.includes(value.type as RelationshipTypeId)) {
    return {
      ok: false,
      error: `Edge ${id} uses unsupported relationship type: ${value.type}`,
    };
  }

  return {
    ok: true,
    data: {
      id,
      from: value.from,
      to: value.to,
      type: value.type as RelationshipTypeId,
      label: typeof value.label === "string" ? value.label : undefined,
      note: typeof value.note === "string" ? value.note : undefined,
      bidirectional:
        typeof value.bidirectional === "boolean" ? value.bidirectional : undefined,
    },
  };
}

export function parseRelationshipMap(value: unknown): ParseResult {
  if (!isRecord(value)) return { ok: false, error: "JSON root must be an object." };
  if (!isString(value.title)) {
    return { ok: false, error: "Map is missing required title." };
  }
  if (!Array.isArray(value.nodes)) {
    return { ok: false, error: "Map is missing required nodes array." };
  }
  if (!Array.isArray(value.edges)) {
    return { ok: false, error: "Map is missing required edges array." };
  }

  const nodes: MapNode[] = [];
  const nodeIds = new Set<string>();
  for (const rawNode of value.nodes) {
    const parsed = parseNode(rawNode);
    if (!parsed.ok) return parsed;
    if (nodeIds.has(parsed.data.id)) {
      return { ok: false, error: `Duplicate node id: ${parsed.data.id}` };
    }
    nodeIds.add(parsed.data.id);
    nodes.push(parsed.data);
  }

  const edges: MapEdge[] = [];
  const edgeIds = new Set<string>();
  for (const rawEdge of value.edges) {
    const parsed = parseEdge(rawEdge);
    if (!parsed.ok) return parsed;
    if (edgeIds.has(parsed.data.id)) {
      return { ok: false, error: `Duplicate edge id: ${parsed.data.id}` };
    }
    if (!nodeIds.has(parsed.data.from)) {
      return {
        ok: false,
        error: `Edge ${parsed.data.id} references unknown node: ${parsed.data.from}`,
      };
    }
    if (!nodeIds.has(parsed.data.to)) {
      return {
        ok: false,
        error: `Edge ${parsed.data.id} references unknown node: ${parsed.data.to}`,
      };
    }
    edgeIds.add(parsed.data.id);
    edges.push(parsed.data);
  }

  return { ok: true, data: { title: value.title, nodes, edges } };
}
