import assert from "node:assert/strict";
import test from "node:test";
import {
  approveRelationshipRequest,
  buildRelationshipEdges,
  calculateRelationshipStrength,
  createRelationshipRequest
} from "./relationships.js";
import type {
  ManualRelationshipAdjustment,
  Person,
  RelationshipEvent,
  RelationshipRequest
} from "./relationships.js";

const people: Person[] = [
  { id: "a", displayName: "A" },
  { id: "b", displayName: "B" },
  { id: "c", displayName: "C" }
];

test("pending and rejected requests are not converted into graph edges", () => {
  const approved = approveRelationshipRequest(
    createRelationshipRequest({
      id: "request:a-b",
      fromPersonId: "a",
      toPersonId: "b",
      now: new Date("2026-04-24T00:00:00.000Z")
    }),
    "human",
    new Date("2026-04-24T00:01:00.000Z")
  );

  const rejected: RelationshipRequest = {
    id: "request:a-c",
    fromPersonId: "a",
    toPersonId: "c",
    status: "rejected",
    approvalSource: "human",
    createdAt: "2026-04-24T00:00:00.000Z"
  };

  const edges = buildRelationshipEdges({
    persons: people,
    requests: [approved, rejected],
    events: []
  });

  assert.equal(edges.length, 1);
  assert.equal(edges[0]?.source, "a");
  assert.equal(edges[0]?.target, "b");
});

test("deep interaction events and manual boosts increase relationship strength", () => {
  const events: RelationshipEvent[] = [
    {
      id: "event:dm",
      personAId: "a",
      personBId: "b",
      type: "dm",
      occurredAt: "2026-04-24T00:00:00.000Z"
    },
    {
      id: "event:home-party",
      personAId: "a",
      personBId: "b",
      type: "home_party",
      occurredAt: "2026-04-25T00:00:00.000Z"
    }
  ];
  const adjustment: ManualRelationshipAdjustment = {
    personAId: "a",
    personBId: "b",
    manualBoost: 10
  };

  const baseScore = calculateRelationshipStrength(events);
  const boostedScore = calculateRelationshipStrength(events, adjustment);

  assert.ok(boostedScore > baseScore);
});

test("approved requests include UI-friendly label, width, and history", () => {
  const request = approveRelationshipRequest(
    createRelationshipRequest({
      id: "request:a-b",
      fromPersonId: "a",
      toPersonId: "b",
      now: new Date("2026-04-24T00:00:00.000Z")
    }),
    "ai",
    new Date("2026-04-24T00:01:00.000Z")
  );

  const edges = buildRelationshipEdges({
    persons: people,
    requests: [request],
    events: [
      {
        id: "event:home-party",
        personAId: "b",
        personBId: "a",
        type: "home_party",
        occurredAt: "2026-04-25T00:00:00.000Z",
        place: "Home party"
      }
    ],
    adjustments: [
      {
        personAId: "a",
        personBId: "b",
        labelOverride: "friend"
      }
    ]
  });

  assert.equal(edges.length, 1);
  assert.equal(edges[0]?.relationshipLabel, "friend");
  assert.ok((edges[0]?.width ?? 0) > 1);
  assert.equal(edges[0]?.events.length, 1);
  assert.match(edges[0]?.summary ?? "", /Home party/);
});
