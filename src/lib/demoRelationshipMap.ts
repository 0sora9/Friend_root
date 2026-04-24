import type { RelationshipMap, RelationshipTypeId } from "../domain/types";
import type { SocialConnections } from "./auth";

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
    featuredPeople?: string[];
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

export type RelationshipPlatform = "linkedin" | "facebook" | "both";

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

export type DemoRelationshipMap = {
  map: RelationshipMap;
  approach: ApproachSuggestion;
  highlightedEdgeIds: Set<string>;
  meta: DemoData["meta"];
  scenarioTitle: string;
  platformCounts: Record<RelationshipPlatform, number>;
};

const image = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;

const communityAnchors: Record<string, { x: number; y: number }> = {
  Tech: { x: 330, y: 260 },
  Finance: { x: 1290, y: 265 },
  Media: { x: 820, y: 130 },
  Startup: { x: 560, y: 620 },
  Academia: { x: 960, y: 670 },
  Community: { x: 1330, y: 720 },
  Business: { x: 1560, y: 410 },
  Creative: { x: 260, y: 720 },
  Enterprise: { x: 1580, y: 705 }
};

const sourceColors: Record<RelationshipPlatform, string> = {
  linkedin: "#2f8db7",
  facebook: "#d94f91",
  both: "#19a59a"
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

export function getRelationshipPlatform(type: string): RelationshipPlatform {
  if (linkedInTypes.has(type)) return "linkedin";
  if (facebookTypes.has(type)) return "facebook";
  if (bothTypes.has(type)) return "both";
  return "both";
}

export function buildRelationshipMapFromDemoData(
  data: DemoData,
  options: { connectedPlatforms: SocialConnections; maxNodes?: number; maxEdges?: number }
): DemoRelationshipMap {
  const scenario = data.meta.demoScenarios[0];
  const startId = scenario?.startingPersonId ?? data.people[0]?.id ?? "";
  const targetId = scenario?.focusPersonId ?? data.people[1]?.id ?? "";
  const peopleById = new Map(data.people.map((person) => [person.id, person]));
  const activeRelationships = data.relationships.filter(
    (relationship) => relationship.status === "active"
  );
  const visibleRelationships = activeRelationships.filter((relationship) =>
    isPlatformConnected(getRelationshipPlatform(relationship.type), options.connectedPlatforms)
  );
  const recommendedPath =
    findPath(startId, targetId, visibleRelationships) ?? [startId, targetId].filter(Boolean);
  const maxNodes = options.maxNodes ?? 32;
  const maxEdges = options.maxEdges ?? 42;
  const includedIds = collectVisiblePersonIds({
    data,
    relationships: visibleRelationships,
    recommendedPath,
    maxNodes
  });
  const communityIndexes = new Map<string, number>();
  const nodes = data.people
    .filter((person) => includedIds.has(person.id))
    .map((person) => {
      const communityIndex = communityIndexes.get(person.community) ?? 0;
      communityIndexes.set(person.community, communityIndex + 1);
      return toMapNode(
        person,
        person.id === startId,
        person.id === targetId,
        communityIndex
      );
    });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = visibleRelationships
    .filter((relationship) => nodeIds.has(relationship.source) && nodeIds.has(relationship.target))
    .sort((left, right) => {
      const leftOnPath = isPathEdge(left.source, left.target, recommendedPath) ? 1 : 0;
      const rightOnPath = isPathEdge(right.source, right.target, recommendedPath) ? 1 : 0;
      if (leftOnPath !== rightOnPath) return rightOnPath - leftOnPath;
      if (left.strength !== right.strength) return right.strength - left.strength;
      return right.sinceYear - left.sinceYear;
    })
    .slice(0, maxEdges)
    .map(toMapEdge);
  const highlightedEdgeIds = new Set(
    edges.filter((edge) => isPathEdge(edge.from, edge.to, recommendedPath)).map((edge) => edge.id)
  );
  const target = peopleById.get(targetId);
  const introducer = peopleById.get(recommendedPath[1] ?? "");

  return {
    map: {
      title: `Friend Root: ${scenario?.title ?? data.meta.title}`,
      nodes,
      edges
    },
    meta: data.meta,
    scenarioTitle: scenario?.title ?? data.meta.title,
    highlightedEdgeIds,
    platformCounts: countPlatforms(edges),
    approach: {
      targetId,
      recommendedPath,
      recommendedIntroducer: introducer?.name ?? "直接アプローチ",
      score: Math.min(96, Math.max(58, Math.round(pathStrength(recommendedPath, visibleRelationships) * 18))),
      whyThisPath: [
        "Friend_root のデモデータから、ログイン中に接続済みのSNSで見える関係だけを使って経路を作成しています。",
        "LinkedInは職歴・投資・事業接点、Facebookは友人・イベント・コミュニティ接点として扱います。",
        "強度の高い関係線と注目人物を優先し、紹介依頼しやすい中継者を選んでいます。"
      ],
      introRequest: `${introducer?.name ?? "紹介者"}さん、${target?.name ?? "ターゲット"}さんに事業連携の相談をしたく、短い壁打ちの形でお繋ぎいただけないでしょうか。`,
      firstMessage: `${target?.name ?? "ご担当者"}さん、突然のご連絡失礼します。共通の接点経由でご紹介いただきました。貴社の取り組みに近い連携仮説があり、15分だけご相談できればと思っています。`,
      risks: [
        "ログインとSNS連携はデモ用モックです。実際のLinkedIn/Facebook APIには接続していません。",
        "複合接点は両方のSNSが接続されている場合だけ表示します。紹介前に最新の関係性を本人へ確認してください。"
      ]
    }
  };
}

function isPlatformConnected(
  platform: RelationshipPlatform,
  connectedPlatforms: SocialConnections
) {
  if (platform === "linkedin") return connectedPlatforms.linkedin;
  if (platform === "facebook") return connectedPlatforms.facebook;
  return connectedPlatforms.linkedin && connectedPlatforms.facebook;
}

function collectVisiblePersonIds(input: {
  data: DemoData;
  relationships: DemoRelationship[];
  recommendedPath: string[];
  maxNodes: number;
}) {
  const pathIds = new Set(input.recommendedPath);
  const ids = new Set<string>([
    ...input.recommendedPath,
    ...(input.data.meta.featuredPeople ?? [])
  ]);

  for (const relationship of [...input.relationships].sort((a, b) => b.strength - a.strength)) {
    if (ids.size >= input.maxNodes) break;
    if (pathIds.has(relationship.source) || pathIds.has(relationship.target)) {
      ids.add(relationship.source);
      ids.add(relationship.target);
    }
  }

  for (const person of [...input.data.people].sort((a, b) => b.influenceScore - a.influenceScore)) {
    if (ids.size >= input.maxNodes) break;
    ids.add(person.id);
  }

  return ids;
}

function toMapNode(
  person: DemoPerson,
  isSelf: boolean,
  isTarget: boolean,
  communityIndex: number
) {
  const anchor = communityAnchors[person.community] ?? { x: 900, y: 460 };
  const position = getCommunityPosition(anchor, communityIndex, person.id);
  const platform = sourceForCommunity(person.community);
  const roleTag = isSelf ? "You" : isTarget ? "Target" : person.community;

  return {
    id: person.id,
    name: person.name,
    subtitle: `${person.occupation} / ${person.organization}`,
    imageUrl: image(person.id),
    x: position.x,
    y: position.y,
    tags: [roleTag, ...person.tags].slice(0, 4),
    color: isTarget ? "#ef4b78" : isSelf ? "#1f6f99" : sourceColors[platform],
    note: `${person.shortBio} ${person.location} / ${person.community} / influence ${person.influenceScore}`
  };
}

function getCommunityPosition(
  anchor: { x: number; y: number },
  communityIndex: number,
  seed: string
) {
  if (communityIndex === 0) {
    return { x: anchor.x, y: anchor.y };
  }

  const ringIndex = Math.floor((communityIndex - 1) / 6);
  const slot = (communityIndex - 1) % 6;
  const radius = 135 + ringIndex * 115;
  const offset = (randomFor(seed) - 0.5) * 0.22;
  const angle = slot * (Math.PI / 3) + offset;

  return {
    x: Math.round(anchor.x + Math.cos(angle) * radius),
    y: Math.round(anchor.y + Math.sin(angle) * radius)
  };
}

function toMapEdge(relationship: DemoRelationship) {
  const platform = getRelationshipPlatform(relationship.type);
  const relationshipType = toRelationshipType(relationship, platform);
  const evidence =
    platform === "linkedin"
      ? "LinkedIn mock profile"
      : platform === "facebook"
        ? "Facebook mock social graph"
        : "LinkedIn + Facebook mock merge";

  return {
    id: relationship.id,
    from: relationship.source,
    to: relationship.target,
    type: relationshipType,
    label: platformLabel(platform, relationship.strength),
    note: `${evidence}. ${relationship.context} / ${relationship.sinceYear}年から / strength ${relationship.strength}/5`,
    bidirectional: relationship.isBidirectional
  };
}

function toRelationshipType(
  relationship: DemoRelationship,
  platform: RelationshipPlatform
): RelationshipTypeId {
  if (relationship.strength >= 5) return "couple";
  if (platform === "linkedin") return "coworker";
  if (platform === "facebook") return "friends";
  if (relationship.type === "advisor" || relationship.type === "mentor") return "admiration";
  return "family";
}

function platformLabel(platform: RelationshipPlatform, strength: number) {
  const prefix =
    platform === "linkedin" ? "LinkedIn" : platform === "facebook" ? "Facebook" : "LinkedIn + Facebook";
  return strength >= 5 ? `${prefix} / Strong` : prefix;
}

function sourceForCommunity(community: string): RelationshipPlatform {
  if (["Tech", "Finance", "Business", "Enterprise", "Academia"].includes(community)) {
    return "linkedin";
  }
  if (["Community", "Creative", "Media"].includes(community)) {
    return "facebook";
  }
  return "both";
}

function findPath(
  startId: string,
  targetId: string,
  relationships: DemoRelationship[]
): string[] | null {
  const adjacency = new Map<string, DemoRelationship[]>();
  for (const relationship of relationships) {
    adjacency.set(relationship.source, [...(adjacency.get(relationship.source) ?? []), relationship]);
    adjacency.set(relationship.target, [...(adjacency.get(relationship.target) ?? []), relationship]);
  }

  const queue: string[][] = [[startId]];
  const seen = new Set([startId]);

  while (queue.length) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    if (!current) continue;
    if (current === targetId) return path;
    if (path.length > 5) continue;

    const nextRelationships = [...(adjacency.get(current) ?? [])].sort(
      (a, b) => b.strength - a.strength
    );

    for (const relationship of nextRelationships) {
      const next = relationship.source === current ? relationship.target : relationship.source;
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push([...path, next]);
    }
  }

  return null;
}

function isPathEdge(from: string, to: string, path: string[]) {
  for (let index = 0; index < path.length - 1; index += 1) {
    const a = path[index];
    const b = path[index + 1];
    if ((from === a && to === b) || (from === b && to === a)) return true;
  }
  return false;
}

function pathStrength(path: string[], relationships: DemoRelationship[]) {
  const relationshipByPair = new Map(
    relationships.map((relationship) => [
      pairKey(relationship.source, relationship.target),
      relationship
    ])
  );
  const scores = path.slice(0, -1).map((id, index) => {
    const next = path[index + 1];
    return next ? relationshipByPair.get(pairKey(id, next))?.strength ?? 3 : 3;
  });
  if (!scores.length) return 3;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function countPlatforms(edges: Array<{ note?: string }>) {
  const counts: Record<RelationshipPlatform, number> = {
    linkedin: 0,
    facebook: 0,
    both: 0
  };

  for (const edge of edges) {
    if (edge.note?.startsWith("LinkedIn mock profile")) counts.linkedin += 1;
    else if (edge.note?.startsWith("Facebook mock social graph")) counts.facebook += 1;
    else counts.both += 1;
  }

  return counts;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("__");
}

function randomFor(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}
