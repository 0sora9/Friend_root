export type Person = {
  id: string;
  displayName: string;
  profileText?: string;
  tags?: string[];
};

export type RelationshipRequestStatus = "pending" | "approved" | "rejected";
export type ApprovalSource = "ai" | "human" | "none";
export type RelationshipLabel =
  | "acquaintance"
  | "friend"
  | "close_friend"
  | "unknown";

export type RelationshipEventType =
  | "dm"
  | "met"
  | "introduced"
  | "event"
  | "home_party"
  | "work"
  | "other";

export type RelationshipRequest = {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  status: RelationshipRequestStatus;
  approvalSource: ApprovalSource;
  requestedReason?: string;
  createdAt: string;
  approvedAt?: string;
};

export type RelationshipEvent = {
  id: string;
  personAId: string;
  personBId: string;
  type: RelationshipEventType;
  occurredAt: string;
  place?: string;
  description?: string;
  weightOverride?: number;
};

export type ManualRelationshipAdjustment = {
  personAId: string;
  personBId: string;
  manualBoost?: number;
  labelOverride?: RelationshipLabel;
  note?: string;
};

export type RelationshipEdge = {
  id: string;
  source: string;
  target: string;
  status: "approved";
  relationshipLabel: RelationshipLabel;
  colorKey: RelationshipLabel;
  strengthScore: number;
  width: number;
  events: RelationshipEvent[];
  summary: string;
  approvalSource: Exclude<ApprovalSource, "none">;
  requestId: string;
};

export type CreateRelationshipRequestInput = {
  fromPersonId: string;
  toPersonId: string;
  requestedReason?: string;
  now?: Date;
  id?: string;
};

export type BuildRelationshipEdgesInput = {
  persons: Person[];
  requests: RelationshipRequest[];
  events: RelationshipEvent[];
  adjustments?: ManualRelationshipAdjustment[];
};

const EVENT_WEIGHTS: Record<RelationshipEventType, number> = {
  dm: 5,
  introduced: 10,
  met: 15,
  event: 20,
  work: 20,
  home_party: 35,
  other: 8
};

export function createRelationshipRequest(
  input: CreateRelationshipRequestInput
): RelationshipRequest {
  assertDifferentPeople(input.fromPersonId, input.toPersonId);

  const createdAt = (input.now ?? new Date()).toISOString();

  return {
    id: input.id ?? createStableRelationshipId("request", input.fromPersonId, input.toPersonId, createdAt),
    fromPersonId: input.fromPersonId,
    toPersonId: input.toPersonId,
    status: "pending",
    approvalSource: "none",
    requestedReason: input.requestedReason,
    createdAt
  };
}

export function approveRelationshipRequest(
  request: RelationshipRequest,
  approvalSource: Exclude<ApprovalSource, "none">,
  approvedAt = new Date()
): RelationshipRequest {
  return {
    ...request,
    status: "approved",
    approvalSource,
    approvedAt: approvedAt.toISOString()
  };
}

export function calculateRelationshipStrength(
  events: RelationshipEvent[],
  adjustment?: ManualRelationshipAdjustment
): number {
  const rawScore =
    events.reduce((total, event) => {
      const baseWeight = event.weightOverride ?? EVENT_WEIGHTS[event.type];
      return total + baseWeight * recencyMultiplier(event.occurredAt);
    }, 0) + (adjustment?.manualBoost ?? 0);

  return clamp(Math.round(rawScore), 0, 100);
}

export function classifyRelationship(input: {
  strengthScore: number;
  events: RelationshipEvent[];
  adjustment?: ManualRelationshipAdjustment;
}): RelationshipLabel {
  if (input.adjustment?.labelOverride) {
    return input.adjustment.labelOverride;
  }

  if (input.events.length === 0) {
    return "unknown";
  }

  if (input.strengthScore >= 70) {
    return "close_friend";
  }

  if (input.strengthScore >= 35) {
    return "friend";
  }

  return "acquaintance";
}

export function buildRelationshipEdges(
  input: BuildRelationshipEdgesInput
): RelationshipEdge[] {
  const personIds = new Set(input.persons.map((person) => person.id));
  const eventsByPair = groupByPair(input.events);
  const adjustmentsByPair = groupAdjustmentsByPair(input.adjustments ?? []);

  return input.requests
    .filter(isApprovedRequest)
    .filter(
      (request) =>
        personIds.has(request.fromPersonId) && personIds.has(request.toPersonId)
    )
    .map((request) => {
      const pairKey = getPairKey(request.fromPersonId, request.toPersonId);
      const events = [...(eventsByPair.get(pairKey) ?? [])].sort(compareEventsDesc);
      const adjustment = adjustmentsByPair.get(pairKey);
      const strengthScore = calculateRelationshipStrength(events, adjustment);
      const relationshipLabel = classifyRelationship({
        strengthScore,
        events,
        adjustment
      });

      return {
        id: `edge:${pairKey}`,
        source: request.fromPersonId,
        target: request.toPersonId,
        status: "approved",
        relationshipLabel,
        colorKey: relationshipLabel,
        strengthScore,
        width: scoreToWidth(strengthScore),
        events,
        summary: createRelationshipSummary(events, strengthScore, relationshipLabel),
        approvalSource: request.approvalSource,
        requestId: request.id
      };
    });
}

function isApprovedRequest(
  request: RelationshipRequest
): request is RelationshipRequest & {
  status: "approved";
  approvalSource: Exclude<ApprovalSource, "none">;
} {
  return request.status === "approved" && request.approvalSource !== "none";
}

function scoreToWidth(score: number): number {
  if (score >= 81) return 6;
  if (score >= 51) return 4;
  if (score >= 21) return 2.5;
  return 1.5;
}

function createRelationshipSummary(
  events: RelationshipEvent[],
  strengthScore: number,
  label: RelationshipLabel
): string {
  if (events.length === 0) {
    return `Approved relationship with no recorded interaction history yet. Score: ${strengthScore}. Label: ${label}.`;
  }

  const latest = events[0];
  const latestPlace = latest?.place ? ` at ${latest.place}` : "";

  return `${events.length} recorded interaction(s). Latest: ${latest?.type}${latestPlace}. Score: ${strengthScore}. Label: ${label}.`;
}

function groupByPair(events: RelationshipEvent[]): Map<string, RelationshipEvent[]> {
  const groups = new Map<string, RelationshipEvent[]>();

  for (const event of events) {
    assertDifferentPeople(event.personAId, event.personBId);
    const pairKey = getPairKey(event.personAId, event.personBId);
    const group = groups.get(pairKey) ?? [];
    group.push(event);
    groups.set(pairKey, group);
  }

  return groups;
}

function groupAdjustmentsByPair(
  adjustments: ManualRelationshipAdjustment[]
): Map<string, ManualRelationshipAdjustment> {
  const groups = new Map<string, ManualRelationshipAdjustment>();

  for (const adjustment of adjustments) {
    assertDifferentPeople(adjustment.personAId, adjustment.personBId);
    groups.set(getPairKey(adjustment.personAId, adjustment.personBId), adjustment);
  }

  return groups;
}

function getPairKey(personAId: string, personBId: string): string {
  return [personAId, personBId].sort().join("__");
}

function compareEventsDesc(
  left: RelationshipEvent,
  right: RelationshipEvent
): number {
  return Date.parse(right.occurredAt) - Date.parse(left.occurredAt);
}

function recencyMultiplier(occurredAt: string): number {
  const occurredTime = Date.parse(occurredAt);

  if (Number.isNaN(occurredTime)) {
    return 1;
  }

  const ageInDays = (Date.now() - occurredTime) / 86_400_000;

  if (ageInDays <= 30) return 1.2;
  if (ageInDays <= 180) return 1;
  return 0.85;
}

function createStableRelationshipId(
  prefix: string,
  personAId: string,
  personBId: string,
  createdAt: string
): string {
  return `${prefix}:${getPairKey(personAId, personBId)}:${createdAt}`;
}

function assertDifferentPeople(personAId: string, personBId: string): void {
  if (personAId === personBId) {
    throw new Error("A relationship requires two different people.");
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
