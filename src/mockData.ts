import demoDataJson from "../data/human_relationship_demo.json";

export type NodeType = "self" | "contact" | "target" | "company" | "community";

export type PersonNode = {
  id: string;
  name: string;
  title: string;
  company: string;
  type: NodeType;
  x: number;
  y: number;
  source: "LinkedIn" | "Facebook" | "Google" | "Manual";
  summary: string;
  community?: string;
  influenceScore?: number;
  tags?: string[];
  isFeatured?: boolean;
};

export type RelationshipType =
  | "LinkedIn connection"
  | "Worked together"
  | "Met recently"
  | "Strong introducer";

export type RelationshipEdge = {
  id: string;
  from: string;
  to: string;
  type: RelationshipType;
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

type DemoPerson = {
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

type DemoRelationship = {
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

type DemoData = {
  meta: {
    title: string;
    peopleCount: number;
    relationshipCount: number;
    featuredPeople: string[];
    demoScenarios: {
      id: string;
      title: string;
      startingPersonId: string;
      focusPersonId: string;
    }[];
  };
  people: DemoPerson[];
  relationships: DemoRelationship[];
};

const demoData = demoDataJson as DemoData;
const scenario = demoData.meta.demoScenarios[0] ?? {
  id: "default",
  title: "紹介経路",
  startingPersonId: demoData.people[0]?.id ?? "",
  focusPersonId: demoData.people[1]?.id ?? ""
};

const peopleById = new Map(demoData.people.map((person) => [person.id, person]));
const relationshipByPair = new Map(
  demoData.relationships.map((relationship) => [
    pairKey(relationship.source, relationship.target),
    relationship
  ])
);

const recommendedPath = findPath(
  scenario.startingPersonId,
  scenario.focusPersonId
);

const visibleIds = new Set<string>([
  scenario.startingPersonId,
  scenario.focusPersonId,
  ...recommendedPath,
  ...demoData.meta.featuredPeople
]);

for (const relationship of demoData.relationships) {
  if (
    relationship.source === scenario.startingPersonId ||
    relationship.target === scenario.startingPersonId ||
    relationship.source === scenario.focusPersonId ||
    relationship.target === scenario.focusPersonId
  ) {
    visibleIds.add(relationship.source);
    visibleIds.add(relationship.target);
  }
}

for (const person of [...demoData.people].sort(
  (a, b) => b.influenceScore - a.influenceScore
)) {
  if (visibleIds.size >= 44) break;
  visibleIds.add(person.id);
}

const visiblePeople = demoData.people.filter((person) => visibleIds.has(person.id));
const communityIndexes = new Map<string, number>();

export const nodes: PersonNode[] = visiblePeople.map((person) => {
  const center = getCommunityCenter(person.community);
  const index = communityIndexes.get(person.community) ?? 0;
  communityIndexes.set(person.community, index + 1);
  const angle = index * 1.72;
  const ring = 42 + Math.floor(index / 4) * 34;
  const isStart = person.id === scenario.startingPersonId;
  const isTarget = person.id === scenario.focusPersonId;

  return {
    id: person.id,
    name: person.name,
    title: person.occupation,
    company: person.organization,
    type: isStart ? "self" : isTarget ? "target" : "contact",
    x: Math.round(center.x + Math.cos(angle) * ring),
    y: Math.round(center.y + Math.sin(angle) * ring),
    source: socialSourceForCommunity(person.community),
    summary: `${person.shortBio} ${person.location} / ${person.community} / influence ${person.influenceScore}`,
    community: person.community,
    influenceScore: person.influenceScore,
    tags: person.tags,
    isFeatured: person.isFeatured
  };
});

const nodeIds = new Set(nodes.map((node) => node.id));

export const edges: RelationshipEdge[] = demoData.relationships
  .filter((relationship) => nodeIds.has(relationship.source) && nodeIds.has(relationship.target))
  .map((relationship) => ({
    id: relationship.id,
    from: relationship.source,
    to: relationship.target,
    type: mapRelationshipType(relationship.type),
    strength: relationship.strength * 20,
    recency: `${relationship.sinceYear}年から`,
    frequency: relationship.isBidirectional ? "双方向の接点" : "一方向の接点",
    evidence: [
      relationship.context,
      `${relationship.sinceYear}年から継続`,
      `${sourceLabelForRelationship(relationship.type)} mock sync`,
      `strength ${relationship.strength}/5`
    ]
  }));

export const highlightedEdgeIds = new Set(
  recommendedPath
    .slice(0, -1)
    .map((id, index) => {
      const next = recommendedPath[index + 1];
      return next ? relationshipByPair.get(pairKey(id, next))?.id : undefined;
    })
    .filter((id): id is string => Boolean(id))
);

const introducerId = recommendedPath[1] ?? scenario.startingPersonId;
const targetPerson = peopleById.get(scenario.focusPersonId);
const introducer = peopleById.get(introducerId);

export const approachSuggestion: ApproachSuggestion = {
  targetId: scenario.focusPersonId,
  recommendedPath,
  recommendedIntroducer: introducer?.name ?? introducerId,
  score: Math.max(55, Math.round(pathStrength(recommendedPath) * 20)),
  whyThisPath: [
    `${scenario.title} のデモシナリオに沿った紹介経路です。`,
    `${introducer?.name ?? "紹介者"} は ${introducer?.community ?? "network"} 側の接点として使いやすい人物です。`,
    `${targetPerson?.name ?? "ターゲット"} までの関係は LinkedIn / Facebook のモック連携データから生成しています。`
  ],
  introRequest: `${introducer?.name ?? "紹介者"}さん、${targetPerson?.name ?? "ターゲット"}さんにお話ししたく、関係性の近い方経由で短くご紹介いただけないでしょうか。`,
  firstMessage: `${targetPerson?.name ?? "ターゲット"}さん、突然のご連絡失礼します。共通の接点からご紹介いただき、事業連携の可能性について15分ほどご相談できればと思っています。`,
  risks: [
    "データはデモ用のため、実際のLinkedIn/Facebook APIとは同期していません。",
    "紹介前に直近の接触状況を本人へ確認する前提です。"
  ]
};

export const demoStats = {
  title: demoData.meta.title,
  scenarioTitle: scenario.title,
  peopleCount: demoData.meta.peopleCount,
  relationshipCount: demoData.meta.relationshipCount,
  visiblePeopleCount: nodes.length,
  visibleRelationshipCount: edges.length
};

export const socialIntegrations = [
  {
    provider: "LinkedIn",
    status: "connected",
    syncedPeople: demoData.people.filter((person) => person.community !== "Community").length
  },
  {
    provider: "Facebook",
    status: "connected",
    syncedPeople: demoData.people.filter((person) =>
      ["Community", "Startup", "Creative", "Media"].includes(person.community)
    ).length
  }
] as const;

function pairKey(a: string, b: string) {
  return [a, b].sort().join("__");
}

function socialSourceForCommunity(
  community: string
): PersonNode["source"] {
  if (["Community", "Startup", "Creative", "Media"].includes(community)) {
    return "Facebook";
  }
  return "LinkedIn";
}

function sourceLabelForRelationship(type: string) {
  return mapRelationshipType(type).includes("LinkedIn") ? "LinkedIn" : "Facebook/LinkedIn";
}

function mapRelationshipType(type: string): RelationshipType {
  if (
    ["coworker", "businessPartner", "projectPeer", "researchPartner", "creativePartner"].includes(type)
  ) {
    return "Worked together";
  }
  if (
    ["mentor", "advisor", "investor", "investorNetwork", "fundraising", "boardConnection", "talentConnector"].includes(type)
  ) {
    return "Strong introducer";
  }
  if (
    ["friend", "peer", "communityPartner", "founderCircle", "alumni", "fan"].includes(type)
  ) {
    return "Met recently";
  }
  return "LinkedIn connection";
}

function getCommunityCenter(community: string) {
  const centers: Record<string, { x: number; y: number }> = {
    Tech: { x: 210, y: 210 },
    Finance: { x: 705, y: 210 },
    Media: { x: 470, y: 130 },
    Startup: { x: 285, y: 430 },
    Academia: { x: 645, y: 455 },
    Community: { x: 470, y: 520 },
    Business: { x: 805, y: 380 },
    Creative: { x: 140, y: 470 },
    Enterprise: { x: 755, y: 545 }
  };
  return centers[community] ?? { x: 450, y: 310 };
}

function findPath(startId: string, targetId: string) {
  const adjacency = new Map<string, DemoRelationship[]>();
  for (const relationship of demoData.relationships.filter((item) => item.status === "active")) {
    adjacency.set(relationship.source, [...(adjacency.get(relationship.source) ?? []), relationship]);
    adjacency.set(relationship.target, [...(adjacency.get(relationship.target) ?? []), relationship]);
  }

  const queue: string[][] = [[startId]];
  const visited = new Set([startId]);

  while (queue.length) {
    const path = queue.shift()!;
    const current = path.at(-1)!;
    if (current === targetId) return path;
    if (path.length >= 5) continue;

    const nextRelationships = [...(adjacency.get(current) ?? [])].sort(
      (a, b) => b.strength - a.strength
    );

    for (const relationship of nextRelationships) {
      const next =
        relationship.source === current ? relationship.target : relationship.source;
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push([...path, next]);
    }
  }

  return [startId, targetId];
}

function pathStrength(path: string[]) {
  const scores = path.slice(0, -1).map((id, index) => {
    const next = path[index + 1];
    return next ? relationshipByPair.get(pairKey(id, next))?.strength ?? 2 : 2;
  });
  if (!scores.length) return 3;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}
