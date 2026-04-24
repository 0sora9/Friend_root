export type SocialConnections = {
  linkedin: boolean;
  facebook: boolean;
};

export type DemoPerson = {
  id: string;
  name: string;
  occupation: string;
  organization: string;
  location: string;
  tags: string[];
  community: string;
  influenceScore: number;
  isFeatured: boolean;
  shortBio: string;
};

export type DemoRelationship = {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  status: string;
  sinceYear: number;
  context: string;
  isBidirectional: boolean;
};

export type DemoData = {
  meta: {
    title: string;
    peopleCount: number;
    relationshipCount: number;
    demoScenarios: Array<{
      id: string;
      title: string;
      startingPersonId: string;
      focusPersonId: string;
    }>;
  };
  people: DemoPerson[];
  relationships: DemoRelationship[];
};

export type NodeType = "self" | "contact" | "target" | "company" | "community";

export type PersonNode = {
  id: string;
  name: string;
  title: string;
  company: string;
  type: NodeType;
  x: number;
  y: number;
  source: "LinkedIn" | "Facebook" | "Both";
  summary: string;
  community: string;
  influenceScore: number;
};

export type RelationshipType =
  | "LinkedIn connection"
  | "Facebook friend"
  | "Worked together"
  | "Community bridge"
  | "Strong introducer";

export type RelationshipEdge = {
  id: string;
  from: string;
  to: string;
  type: RelationshipType;
  platform: "linkedin" | "facebook" | "both";
  strength: number;
  recency: string;
  frequency: string;
  evidence: string[];
};

export type ApproachSuggestion = {
  targetId: string;
  recommendedPath: string[];
  recommendedIntroducer: string;
  score: number;
  whyThisPath: string[];
  introRequest: string;
  firstMessage: string;
  risks: string[];
};

export type DemoRelationshipGraph = {
  meta: DemoData["meta"];
  nodes: PersonNode[];
  edges: RelationshipEdge[];
  highlightedEdgeIds: Set<string>;
  approachSuggestion: ApproachSuggestion;
  scenarioTitle: string;
};

const communityAnchors: Record<string, { x: number; y: number }> = {
  Tech: { x: 230, y: 170 },
  Finance: { x: 690, y: 170 },
  Media: { x: 520, y: 95 },
  Startup: { x: 430, y: 320 },
  Academia: { x: 230, y: 470 },
  Community: { x: 560, y: 510 },
  Business: { x: 760, y: 390 },
  Creative: { x: 120, y: 330 },
  Enterprise: { x: 800, y: 265 }
};

const linkedInTypes = new Set([
  "coworker",
  "investor",
  "investorNetwork",
  "businessPartner",
  "fundraising",
  "projectPeer",
  "legalAdvisor",
  "talentConnector",
  "boardConnection",
  "researchPartner"
]);

const facebookTypes = new Set([
  "friend",
  "fan",
  "communityPartner",
  "creativePartner",
  "mediaConnection",
  "founderCircle"
]);

const bothTypes = new Set(["alumni", "mentor", "advisor", "peer"]);

export function getRelationshipPlatform(type: string): "linkedin" | "facebook" | "both" {
  if (linkedInTypes.has(type)) return "linkedin";
  if (facebookTypes.has(type)) return "facebook";
  if (bothTypes.has(type)) return "both";
  return "both";
}

export function buildDemoRelationshipGraph(
  data: DemoData,
  options: { connectedPlatforms: SocialConnections }
): DemoRelationshipGraph {
  const scenario = data.meta.demoScenarios[0];
  const startId = scenario?.startingPersonId ?? data.people[0]?.id ?? "";
  const focusId = scenario?.focusPersonId ?? data.people[1]?.id ?? "";
  const peopleById = new Map(data.people.map((person) => [person.id, person]));
  const visibleRelationships = data.relationships.filter((relationship) => {
    const platform = getRelationshipPlatform(relationship.type);
    if (platform === "linkedin") return options.connectedPlatforms.linkedin;
    if (platform === "facebook") return options.connectedPlatforms.facebook;
    return options.connectedPlatforms.linkedin && options.connectedPlatforms.facebook;
  });
  const path = findPath(startId, focusId, visibleRelationships) ?? [startId, focusId].filter(Boolean);
  const pathIds = new Set(path);
  const featured = data.people
    .filter((person) => person.isFeatured)
    .map((person) => person.id);
  const highInfluence = [...data.people]
    .sort((a, b) => b.influenceScore - a.influenceScore)
    .slice(0, 32)
    .map((person) => person.id);
  const connectedToPath = visibleRelationships
    .filter((relationship) => pathIds.has(relationship.source) || pathIds.has(relationship.target))
    .flatMap((relationship) => [relationship.source, relationship.target]);
  const includedIds = new Set([...featured, ...highInfluence, ...connectedToPath, ...path]);
  const nodes = data.people
    .filter((person) => includedIds.has(person.id))
    .map((person) => toNode(person, person.id === startId, person.id === focusId));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = visibleRelationships
    .filter((relationship) => nodeIds.has(relationship.source) && nodeIds.has(relationship.target))
    .map(toEdge);
  const highlightedEdgeIds = new Set(
    edges
      .filter((edge) => isPathEdge(edge, path))
      .map((edge) => edge.id)
  );
  const target = peopleById.get(focusId);
  const introducerId = path[1];
  const introducer = introducerId ? peopleById.get(introducerId) : undefined;

  return {
    meta: data.meta,
    nodes,
    edges,
    highlightedEdgeIds,
    scenarioTitle: scenario?.title ?? "デモ関係経路",
    approachSuggestion: {
      targetId: focusId,
      recommendedPath: path,
      recommendedIntroducer: introducer?.name ?? "直接アプローチ",
      score: Math.min(96, 62 + path.length * 7 + highlightedEdgeIds.size * 4),
      whyThisPath: [
        "リポジトリ内の200人規模デモデータから、接続済みSNSで見える関係だけを使って経路を算出しています。",
        "LinkedInは職歴・投資・事業接点、Facebookは友人・コミュニティ・イベント接点として扱っています。",
        "強度の高い関係線と注目人物を優先して、紹介依頼しやすい経路をハイライトしています。"
      ],
      introRequest: `${introducer?.name ?? "紹介者"}さん、${target?.name ?? "ターゲット"}さんに事業連携の相談をしたく、短い壁打ちの形でお繋ぎいただけないか相談させてください。`,
      firstMessage: `${target?.name ?? "ご担当者"}さん、突然のご連絡失礼します。共通の接点経由でご紹介いただきました。貴社の取り組みに近い連携仮説があり、15分だけご相談できればと思っています。`,
      risks: [
        "これはダミーデータとモック連携によるデモです。実際のLinkedIn/Facebook APIには接続していません。",
        "両SNSを接続した状態でのみ、alumni / mentor / advisor / peer のような複合接点を表示します。"
      ]
    }
  };
}

function toNode(person: DemoPerson, isSelf: boolean, isTarget: boolean): PersonNode {
  const anchor = communityAnchors[person.community] ?? { x: 460, y: 310 };
  const jitterX = (randomFor(`${person.id}:x`) - 0.5) * 120;
  const jitterY = (randomFor(`${person.id}:y`) - 0.5) * 92;

  return {
    id: person.id,
    name: person.name,
    title: person.occupation,
    company: person.organization,
    type: isSelf ? "self" : isTarget ? "target" : "contact",
    x: Math.round(anchor.x + jitterX),
    y: Math.round(anchor.y + jitterY),
    source: sourceForCommunity(person.community),
    summary: person.shortBio,
    community: person.community,
    influenceScore: person.influenceScore
  };
}

function toEdge(relationship: DemoRelationship): RelationshipEdge {
  const platform = getRelationshipPlatform(relationship.type);
  const strength = relationship.strength * 20;

  return {
    id: relationship.id,
    from: relationship.source,
    to: relationship.target,
    platform,
    type: typeToEdgeTheme(relationship.type, platform, strength),
    strength,
    recency: `${relationship.sinceYear}年から`,
    frequency: relationship.isBidirectional ? "双方向の接点" : "片方向の接点",
    evidence: [
      relationship.context,
      platform === "linkedin" ? "LinkedIn mock profile" : platform === "facebook" ? "Facebook mock social graph" : "LinkedIn + Facebook mock merge",
      `relationship type: ${relationship.type}`
    ]
  };
}

function typeToEdgeTheme(
  type: string,
  platform: "linkedin" | "facebook" | "both",
  strength: number
): RelationshipType {
  if (strength >= 86) return "Strong introducer";
  if (type === "coworker" || type === "businessPartner" || type === "projectPeer") return "Worked together";
  if (platform === "facebook") return "Facebook friend";
  if (platform === "both") return "Community bridge";
  return "LinkedIn connection";
}

function sourceForCommunity(community: string): PersonNode["source"] {
  if (["Tech", "Finance", "Business", "Enterprise"].includes(community)) return "LinkedIn";
  if (["Community", "Creative", "Media"].includes(community)) return "Facebook";
  return "Both";
}

function findPath(
  startId: string,
  targetId: string,
  relationships: DemoRelationship[]
): string[] | null {
  const graph = new Map<string, string[]>();
  for (const relationship of relationships) {
    graph.set(relationship.source, [...(graph.get(relationship.source) ?? []), relationship.target]);
    graph.set(relationship.target, [...(graph.get(relationship.target) ?? []), relationship.source]);
  }

  const queue: string[][] = [[startId]];
  const seen = new Set([startId]);

  while (queue.length) {
    const path = queue.shift()!;
    const current = path[path.length - 1]!;
    if (current === targetId) return path;
    if (path.length > 5) continue;

    for (const next of graph.get(current) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push([...path, next]);
    }
  }

  return null;
}

function isPathEdge(edge: RelationshipEdge, path: string[]) {
  for (let index = 0; index < path.length - 1; index += 1) {
    const a = path[index];
    const b = path[index + 1];
    if ((edge.from === a && edge.to === b) || (edge.from === b && edge.to === a)) return true;
  }
  return false;
}

function randomFor(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}
