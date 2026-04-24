import assert from "node:assert/strict";
import test from "node:test";
import demoDataJson from "../../data/human_relationship_demo.json" with { type: "json" };
import {
  buildRelationshipMapFromDemoData,
  getRelationshipPlatform,
  type DemoData
} from "./demoRelationshipMap.js";

const demoData = demoDataJson as DemoData;

test("builds a relationship map from repository demo data", () => {
  const graph = buildRelationshipMapFromDemoData(demoData, {
    connectedPlatforms: { linkedin: true, facebook: true },
    maxNodes: 42
  });

  assert.match(graph.map.title, /TechからFinanceへの紹介経路/);
  assert.ok(graph.map.nodes.length >= 12);
  assert.ok(graph.map.edges.length >= 12);
  assert.ok(graph.map.nodes.some((node) => node.id === "rena_asakura"));
  assert.ok(graph.map.nodes.some((node) => node.id === "ren_ogasawara"));
  assert.ok(graph.map.nodes.every((node) => node.imageUrl.startsWith("https://api.dicebear.com/")));
  assert.ok(graph.highlightedEdgeIds.size >= 1);
  assert.ok(graph.approach.recommendedPath.length >= 2);
});

test("social platform settings exclude unavailable relationship sources", () => {
  const linkedInOnly = buildRelationshipMapFromDemoData(demoData, {
    connectedPlatforms: { linkedin: true, facebook: false },
    maxNodes: 60
  });
  const facebookOnly = buildRelationshipMapFromDemoData(demoData, {
    connectedPlatforms: { linkedin: false, facebook: true },
    maxNodes: 60
  });

  assert.ok(linkedInOnly.map.edges.length > 0);
  assert.ok(facebookOnly.map.edges.length > 0);
  assert.equal(
    linkedInOnly.map.edges.every((edge) => edge.note?.includes("Facebook mock social graph") !== true),
    true
  );
  assert.equal(
    facebookOnly.map.edges.every((edge) => edge.note?.includes("LinkedIn mock profile") !== true),
    true
  );
});

test("limits visible nodes and edges for the interactive map surface", () => {
  const graph = buildRelationshipMapFromDemoData(demoData, {
    connectedPlatforms: { linkedin: true, facebook: true },
    maxNodes: 24,
    maxEdges: 28
  });

  assert.ok(graph.map.nodes.length <= 24);
  assert.ok(graph.map.edges.length <= 28);
  assert.ok(graph.approach.recommendedPath.every((id) => graph.map.nodes.some((node) => node.id === id)));
});

test("places visible nodes far enough apart for avatar cards", () => {
  const graph = buildRelationshipMapFromDemoData(demoData, {
    connectedPlatforms: { linkedin: true, facebook: true },
    maxNodes: 32,
    maxEdges: 42
  });
  let minimumDistance = Number.POSITIVE_INFINITY;

  for (let leftIndex = 0; leftIndex < graph.map.nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < graph.map.nodes.length; rightIndex += 1) {
      const left = graph.map.nodes[leftIndex]!;
      const right = graph.map.nodes[rightIndex]!;
      minimumDistance = Math.min(
        minimumDistance,
        Math.hypot(left.x - right.x, left.y - right.y)
      );
    }
  }

  assert.ok(minimumDistance >= 70);
});

test("relationship platform mapping separates LinkedIn, Facebook, and merged signals", () => {
  assert.equal(getRelationshipPlatform("coworker"), "linkedin");
  assert.equal(getRelationshipPlatform("friend"), "facebook");
  assert.equal(getRelationshipPlatform("mentor"), "both");
});
