export type RelationshipTypeId =
  | "couple"
  | "friends"
  | "former_friends"
  | "rival"
  | "family"
  | "coworker"
  | "admiration";

export interface MapNode {
  id: string;
  name: string;
  imageUrl: string;
  x: number;
  y: number;
  subtitle?: string;
  tags?: string[];
  color?: string;
  note?: string;
}

export interface MapEdge {
  id: string;
  from: string;
  to: string;
  type: RelationshipTypeId;
  label?: string;
  note?: string;
  bidirectional?: boolean;
}

export interface RelationshipMap {
  title: string;
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface RelationshipTypeDefinition {
  id: RelationshipTypeId;
  label: string;
  color: string;
  icon: string;
  strokeWidth: number;
  dashArray?: string;
  bidirectionalDefault: boolean;
}
