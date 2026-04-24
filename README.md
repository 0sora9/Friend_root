# Friend_root

DEEPCORExOpenAI Hackathon team3 repository.

## Relationship graph utilities

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

## Development

```bash
npm install
npm run typecheck
npm test
```
