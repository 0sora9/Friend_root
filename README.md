# Friend Root

Relationship-map demo for finding the best introduction path to a target person.

## What This Demo Shows

- A relationship map with people, companies, communities, and connection strength.
- Target detail and edge evidence, updated by clicking nodes or edges.
- AI-suggested approach strategy using fixed mock suggestions.
- Demo login with fixed local credentials and mock LinkedIn/Facebook sign-in.
- Dummy LinkedIn/Facebook/Google-style data only. No external API, login, database, or real AI call is used.

## Run Locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173/`.

Demo login:

- Email: `demo@friendroot.local`
- Password: `friend-root`
- LinkedIn / Facebook buttons use local mock sign-in only.

## Build

```bash
pnpm build
```

## Mock Data

Demo data is isolated in `src/mockData.ts` so the UI can later be connected to real LinkedIn, Facebook, Google Contacts, Calendar, or Gmail metadata adapters.

## Relationship Graph Utilities

The relationship logic is intentionally framework-independent so UI, API, and database work can reference it from any plan.

```ts
import {
  buildRelationshipEdges,
  createRelationshipRequest,
  approveRelationshipRequest
} from "./src/lib/relationships";
```

The graph UI should consume `RelationshipEdge[]` from `buildRelationshipEdges`.

- `relationshipLabel` / `colorKey`: line color category such as `friend` or `acquaintance`
- `strengthScore`: relationship strength from `0` to `100`
- `width`: suggested line width for the bubble graph
- `events`: interaction history, including when and where people met
- `summary`: short display text for hover or detail panels

Relationships are only rendered when a request is approved. One person creates a request, then either AI or a human approves it.

```ts
const pending = createRelationshipRequest({
  fromPersonId: "person:aki",
  toPersonId: "person:ren",
  requestedReason: "Met at the hackathon kickoff."
});

const approved = approveRelationshipRequest(pending, "human");
```

For local demo data, import from `src/lib/relationships.mock.ts`.

## Test

```bash
pnpm test
pnpm typecheck
```
