import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildDemoRelationshipGraph, type PersonNode, type RelationshipEdge } from "./lib/demoGraph";

type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string };

type Props = {
  graph: ReturnType<typeof buildDemoRelationshipGraph>;
  selection: Selection;
  onSelect: (selection: Selection) => void;
};

const edgeColors: Record<RelationshipEdge["type"], string> = {
  "LinkedIn connection": "#2f7cff",
  "Facebook friend": "#f04aa8",
  "Worked together": "#18c7a3",
  "Community bridge": "#f6aa3b",
  "Strong introducer": "#9a6cff"
};

const sourceColors: Record<PersonNode["source"], string> = {
  LinkedIn: "#35a7ff",
  Facebook: "#f04aa8",
  Both: "#41d6b7"
};

export function ThreeRelationshipMap({ graph, selection, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);
  const selectionRef = useRef(selection);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    const hostElement = hostRef.current;
    if (!hostElement) return;

    const host = hostElement;
    host.innerHTML = "";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05070d");
    scene.fog = new THREE.Fog("#05070d", 12, 30);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 5.8, 13.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 26;
    controls.target.set(0, 0.1, 0);

    scene.add(new THREE.AmbientLight("#bcd9ff", 1.15));
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.3);
    keyLight.position.set(4, 8, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight("#37c7ff", 1.35, 20);
    rimLight.position.set(-5, 3, 5);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(17, 17, "#1f4673", "#10213b");
    grid.position.y = -2.8;
    scene.add(grid);

    const nodeMeshes = new Map<string, THREE.Mesh>();
    const nodePositions = new Map<string, THREE.Vector3>();
    const edgeMeshes = new Map<string, THREE.Mesh>();
    const directByNode = new Map<string, Set<string>>();
    const directEdgesByNode = new Map<string, Set<string>>();

    graph.nodes.forEach((node) => {
      const position = positionForNode(node);
      nodePositions.set(node.id, position);
      directByNode.set(node.id, new Set([node.id]));
      directEdgesByNode.set(node.id, new Set());
    });

    graph.edges.forEach((edge) => {
      directByNode.get(edge.from)?.add(edge.to);
      directByNode.get(edge.to)?.add(edge.from);
      directEdgesByNode.get(edge.from)?.add(edge.id);
      directEdgesByNode.get(edge.to)?.add(edge.id);
    });

    graph.edges.forEach((edge) => {
      const from = nodePositions.get(edge.from);
      const to = nodePositions.get(edge.to);
      if (!from || !to) return;

      const curve = new THREE.CatmullRomCurve3([from, to]);
      const isHighlighted = graph.highlightedEdgeIds.has(edge.id);
      const radius = (0.038 + edge.strength / 1500) * (isHighlighted ? 1.45 : 1);
      const geometry = new THREE.TubeGeometry(curve, 12, radius, 10, false);
      const material = new THREE.MeshBasicMaterial({
        color: edgeColors[edge.type],
        transparent: true,
        opacity: isHighlighted ? 0.98 : 0.56
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.edgeId = edge.id;
      edgeMeshes.set(edge.id, mesh);
      scene.add(mesh);
    });

    graph.nodes.forEach((node) => {
      const radius = node.type === "self" || node.type === "target" ? 0.36 : 0.22 + node.influenceScore / 650;
      const material = new THREE.MeshStandardMaterial({
        color: sourceColors[node.source],
        emissive: sourceColors[node.source],
        emissiveIntensity: node.type === "target" ? 0.42 : 0.2,
        metalness: 0.14,
        roughness: 0.38,
        transparent: true
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 34, 34), material);
      mesh.position.copy(nodePositions.get(node.id)!);
      mesh.userData.nodeId = node.id;
      nodeMeshes.set(node.id, mesh);
      scene.add(mesh);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.85, 0.012, 8, 42),
        new THREE.MeshBasicMaterial({
          color: sourceColors[node.source],
          transparent: true,
          opacity: graph.approachSuggestion.recommendedPath.includes(node.id) ? 0.72 : 0.24
        })
      );
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
    });

    const labels = createLabels(graph.nodes, nodePositions);
    host.appendChild(labels);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function resize() {
      const width = host.clientWidth || 900;
      const height = host.clientHeight || 620;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function updatePointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function handlePointerMove(event: PointerEvent) {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...nodeMeshes.values()], false)[0];
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    }

    function handleClick(event: PointerEvent) {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...nodeMeshes.values()], false)[0];
      const nodeId = hit?.object.userData.nodeId as string | undefined;
      if (nodeId) {
        onSelectRef.current({ kind: "node", id: nodeId });
      }
    }

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("click", handleClick);
    window.addEventListener("resize", resize);
    resize();

    let frame = 0;
    let raf = 0;

    function paintSelection() {
      const currentSelection = selectionRef.current;
      const selectedNodeId = currentSelection.kind === "node" ? currentSelection.id : null;
      const directPeople = selectedNodeId ? directByNode.get(selectedNodeId) ?? new Set<string>() : new Set<string>();
      const directEdges = selectedNodeId ? directEdgesByNode.get(selectedNodeId) ?? new Set<string>() : new Set<string>();

      nodeMeshes.forEach((mesh, id) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        const isSelected = id === selectedNodeId;
        const isPath = graph.approachSuggestion.recommendedPath.includes(id);
        const isDirect = !selectedNodeId || directPeople.has(id);
        mesh.scale.setScalar(isSelected ? 1.85 : isPath ? 1.35 : 1);
        material.opacity = isDirect ? 1 : 0.22;
        material.transparent = !isDirect;
      });

      edgeMeshes.forEach((mesh, id) => {
        const material = mesh.material as THREE.MeshBasicMaterial;
        const isPath = graph.highlightedEdgeIds.has(id);
        const isDirect = !selectedNodeId || directEdges.has(id);
        material.opacity = selectedNodeId ? (isDirect ? 0.98 : 0.12) : isPath ? 0.98 : 0.5;
      });
    }

    function animate() {
      frame += 0.01;
      nodeMeshes.forEach((mesh, id) => {
        const base = nodePositions.get(id);
        if (!base) return;
        mesh.position.y = base.y + Math.sin(frame + base.x) * 0.035;
        mesh.rotation.y += 0.004;
      });
      paintSelection();
      updateLabels(labels, graph.nodes, nodePositions, camera, renderer);
      controls.update();
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.dispose();
      host.innerHTML = "";
    };
  }, [graph]);

  return <div className="three-map" ref={hostRef} />;
}

function positionForNode(node: PersonNode) {
  const x = (node.x - 450) / 58;
  const z = (node.y - 310) / 58;
  const y = (node.influenceScore - 70) / 34 + (node.type === "target" ? 0.6 : 0);
  return new THREE.Vector3(x, y, z);
}

function createLabels(nodes: PersonNode[], positions: Map<string, THREE.Vector3>) {
  const layer = document.createElement("div");
  layer.className = "three-label-layer";
  nodes
    .filter((node) => node.type === "self" || node.type === "target" || node.influenceScore >= 84)
    .forEach((node) => {
      const label = document.createElement("button");
      label.type = "button";
      label.className = `three-label label-${node.type}`;
      label.dataset.nodeId = node.id;
      label.innerHTML = `<strong>${node.name}</strong><span>${node.community}</span>`;
      const position = positions.get(node.id);
      if (position) label.dataset.position = JSON.stringify(position.toArray());
      layer.appendChild(label);
    });
  return layer;
}

function updateLabels(
  layer: HTMLDivElement,
  nodes: PersonNode[],
  positions: Map<string, THREE.Vector3>,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) {
  const width = renderer.domElement.clientWidth;
  const height = renderer.domElement.clientHeight;
  const byId = new Map(nodes.map((node) => [node.id, node]));

  layer.querySelectorAll<HTMLButtonElement>(".three-label").forEach((label) => {
    const node = byId.get(label.dataset.nodeId ?? "");
    const position = node ? positions.get(node.id) : undefined;
    if (!node || !position) return;
    const screen = position.clone().project(camera);
    const x = (screen.x * 0.5 + 0.5) * width;
    const y = (-screen.y * 0.5 + 0.5) * height;
    label.style.transform = `translate(${x}px, ${y}px)`;
    label.style.opacity = screen.z > 1 ? "0" : "1";
  });
}
