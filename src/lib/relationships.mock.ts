import type {
  ManualRelationshipAdjustment,
  Person,
  RelationshipEvent,
  RelationshipRequest
} from "./relationships.js";
import {
  approveRelationshipRequest,
  buildRelationshipEdges,
  createRelationshipRequest
} from "./relationships.js";

export const demoPeople: Person[] = [
  {
    id: "person:aki",
    displayName: "Aki",
    profileText: "Enjoys home parties, coffee, and product design.",
    tags: ["design", "coffee", "host"]
  },
  {
    id: "person:ren",
    displayName: "Ren",
    profileText: "Backend engineer who often joins local meetups.",
    tags: ["backend", "meetup", "music"]
  },
  {
    id: "person:mio",
    displayName: "Mio",
    profileText: "Friend of Aki and organizer of small community events.",
    tags: ["community", "events"]
  }
];

const akiToRenRequest = approveRelationshipRequest(
  createRelationshipRequest({
    id: "request:aki-ren",
    fromPersonId: "person:aki",
    toPersonId: "person:ren",
    requestedReason: "Met at a hackathon kickoff.",
    now: new Date("2026-04-24T06:00:00.000Z")
  }),
  "human",
  new Date("2026-04-24T06:05:00.000Z")
);

const renToMioRequest = approveRelationshipRequest(
  createRelationshipRequest({
    id: "request:ren-mio",
    fromPersonId: "person:ren",
    toPersonId: "person:mio",
    requestedReason: "Introduced by Aki.",
    now: new Date("2026-04-24T06:10:00.000Z")
  }),
  "ai",
  new Date("2026-04-24T06:11:00.000Z")
);

export const demoRelationshipRequests: RelationshipRequest[] = [
  akiToRenRequest,
  renToMioRequest,
  createRelationshipRequest({
    id: "request:aki-mio-pending",
    fromPersonId: "person:aki",
    toPersonId: "person:mio",
    requestedReason: "Pending request for demo state.",
    now: new Date("2026-04-24T06:20:00.000Z")
  })
];

export const demoRelationshipEvents: RelationshipEvent[] = [
  {
    id: "event:aki-ren-dm",
    personAId: "person:aki",
    personBId: "person:ren",
    type: "dm",
    occurredAt: "2026-04-24T06:30:00.000Z",
    description: "Shared contact details after the kickoff."
  },
  {
    id: "event:aki-ren-home-party",
    personAId: "person:aki",
    personBId: "person:ren",
    type: "home_party",
    occurredAt: "2026-04-25T10:00:00.000Z",
    place: "Aki's apartment",
    description: "Joined a small home party with mutual friends."
  },
  {
    id: "event:ren-mio-introduced",
    personAId: "person:ren",
    personBId: "person:mio",
    type: "introduced",
    occurredAt: "2026-04-24T07:00:00.000Z",
    place: "Hackathon venue",
    description: "Introduced by Aki during team formation."
  }
];

export const demoRelationshipAdjustments: ManualRelationshipAdjustment[] = [
  {
    personAId: "person:aki",
    personBId: "person:ren",
    manualBoost: 10,
    note: "They already knew each other before the hackathon."
  }
];

export const demoRelationshipEdges = buildRelationshipEdges({
  persons: demoPeople,
  requests: demoRelationshipRequests,
  events: demoRelationshipEvents,
  adjustments: demoRelationshipAdjustments
});
