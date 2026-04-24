const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");
const filterTray = document.getElementById("filterTray");
const filterTab = document.getElementById("filterTab");
const filterHotspot = document.getElementById("filterHotspot");
const pinFilters = document.getElementById("pinFilters");
const categoryFilters = document.getElementById("categoryFilters");
const strengthRange = document.getElementById("strengthRange");
const strengthValue = document.getElementById("strengthValue");
const confidenceRange = document.getElementById("confidenceRange");
const confidenceValue = document.getElementById("confidenceValue");
const resetButton = document.getElementById("resetButton");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const inspector = document.getElementById("inspector");
const closeInspector = document.getElementById("closeInspector");
const bootStatus = document.getElementById("bootStatus");

const CATEGORIES = {
  work: { label: "Work", color: "#5DADEC", angle: -0.35 },
  school: { label: "School", color: "#6FD08C", angle: 0.85 },
  community: { label: "Community", color: "#F6C85F", angle: 2.05 },
  founder: { label: "Founder", color: "#FF7A6B", angle: 3.18 },
  investor: { label: "Investor", color: "#C084FC", angle: 4.28 },
  other: { label: "Other", color: "#9CA3AF", angle: 5.34 },
};

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  view: { x: 0, y: 0, k: 1 },
  mouse: { x: 0, y: 0, worldX: 0, worldY: 0 },
  hoveredNode: null,
  selectedNode: null,
  route: [],
  routeEdges: new Set(),
  startTime: 0,
  introDuration: 1600,
  filterPinned: false,
  isPanning: false,
  isDraggingNode: false,
  dragNode: null,
  dragStart: { x: 0, y: 0 },
  filter: {
    degrees: new Set([1, 2, 3]),
    categories: new Set(Object.keys(CATEGORIES)),
    minStrength: 0.2,
    minConfidence: 0.3,
  },
};

const graph = createMockGraph();
const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));

for (const edge of graph.edges) {
  edge.sourceNode = nodesById.get(edge.source);
  edge.targetNode = nodesById.get(edge.target);
}

initializePositions();
buildCategoryControls();
bindEvents();
resizeCanvas();
requestAnimationFrame((time) => {
  state.startTime = time;
  requestAnimationFrame(frame);
});

function createMockGraph() {
  const nodes = [
    person("me", "あなた", "AI Product Engineer / Founder", "founder", 0, 100),
    person("aiko", "森 愛子", "前職のPM / SaaS Growth", "work", 1, 91),
    person("kaito", "佐藤 海斗", "大学同期 / ML Engineer", "school", 1, 88),
    person("maya", "小林 真矢", "コミュニティ主催 / Founder", "community", 1, 95),
    person("ren", "藤原 蓮", "Fintech Founder", "founder", 2, 89),
    person("miyamoto", "宮本 玲", "Partner / Seed Investor", "investor", 3, 98),
    person("natsuki", "山本 夏希", "Angel Investor / ex-CTO", "investor", 2, 93),
    person("sena", "高橋 瀬奈", "Design Engineer", "work", 1, 78),
    person("rio", "伊藤 理央", "AI Safety Researcher", "school", 2, 76),
    person("haru", "田中 晴", "Robotics Founder", "founder", 2, 82),
    person("yuna", "中村 由奈", "Platform Lead", "work", 1, 84),
    person("daichi", "松本 大地", "Startup CFO", "other", 2, 72),
    person("eri", "井上 絵里", "VC Associate", "investor", 2, 79),
    person("sora", "清水 空", "DevRel / Community", "community", 1, 86),
    person("akari", "石田 明里", "Healthcare Founder", "founder", 3, 81),
    person("leo", "岡田 怜央", "Growth Advisor", "other", 2, 70),
  ];

  const pools = {
    work: [
      "鈴木 玲奈",
      "加藤 悠真",
      "吉田 葵",
      "山口 蒼",
      "橋本 莉子",
      "木村 湊",
      "斎藤 花",
      "林 颯太",
    ],
    school: [
      "渡辺 陽菜",
      "小川 樹",
      "長谷川 凛",
      "近藤 翼",
      "村上 紬",
      "石川 隼",
      "前田 美月",
      "遠藤 陽翔",
    ],
    community: [
      "青木 さくら",
      "坂本 結衣",
      "西村 新",
      "福田 栞",
      "太田 匠",
      "三浦 心",
      "藤田 碧",
      "原田 悠",
    ],
    founder: [
      "池田 奏",
      "森田 澪",
      "酒井 悠斗",
      "内田 杏",
      "柴田 陸",
      "菊池 乃愛",
      "野村 湊斗",
      "久保 朱莉",
    ],
    investor: [
      "片山 匠海",
      "上田 紬",
      "杉山 璃久",
      "丸山 琴音",
      "今井 伊織",
      "河野 葵",
      "小野寺 蓮",
      "宮崎 栞",
    ],
    other: ["成田 司", "安藤 光", "関口 凛", "大野 旭", "横山 玲", "白石 海"],
  };

  const titles = {
    work: ["Product Lead", "Backend Engineer", "Enterprise Sales", "Data Scientist"],
    school: ["Research Engineer", "Graduate Founder", "AI Researcher", "Lab Alumni"],
    community: ["Meetup Organizer", "Hackathon Mentor", "OSS Maintainer", "Builder Community"],
    founder: ["B2B SaaS Founder", "AI Agent Founder", "Climate Tech Founder", "Consumer AI Founder"],
    investor: ["Principal / VC", "Angel Investor", "Scout / VC", "Partner / VC"],
    other: ["Operator", "Advisor", "Recruiter", "Legal Counsel"],
  };

  for (const [category, names] of Object.entries(pools)) {
    names.forEach((name, index) => {
      const degree = category === "investor" ? 2 + (index % 2) : 1 + (index % 3);
      const influence = 54 + Math.round(randomFor(`${category}-${index}`) * 40);
      nodes.push(
        person(
          `${category}-${index}`,
          name,
          titles[category][index % titles[category].length],
          category,
          degree,
          influence,
        ),
      );
    });
  }

  const edges = [];
  const link = (source, target, strength, confidence, context) => {
    edges.push({ source, target, strength, confidence, context });
  };

  link("me", "maya", 0.94, 0.96, "共同イベント運営");
  link("maya", "ren", 0.88, 0.92, "創業者コミュニティ");
  link("ren", "miyamoto", 0.82, 0.9, "投資検討ミーティング");
  link("me", "aiko", 0.91, 0.97, "前職の直属チーム");
  link("me", "kaito", 0.86, 0.93, "大学研究室");
  link("me", "sora", 0.8, 0.9, "AIイベント運営");
  link("me", "yuna", 0.76, 0.88, "共同プロジェクト");
  link("me", "sena", 0.7, 0.82, "デザインレビュー");
  link("aiko", "natsuki", 0.78, 0.87, "前職CxOネットワーク");
  link("kaito", "rio", 0.73, 0.84, "研究テーマ");
  link("sora", "eri", 0.72, 0.86, "スタートアップイベント");
  link("yuna", "haru", 0.69, 0.83, "Platform導入相談");
  link("ren", "akari", 0.66, 0.78, "Founder peer");
  link("natsuki", "miyamoto", 0.65, 0.75, "共同投資先");
  link("eri", "miyamoto", 0.58, 0.82, "同VCネットワーク");
  link("daichi", "leo", 0.64, 0.74, "資本政策相談");
  link("leo", "miyamoto", 0.52, 0.68, "紹介可能");

  const firstDegree = nodes.filter((node) => node.degree === 1 && node.id !== "me");
  const secondDegree = nodes.filter((node) => node.degree === 2);
  const thirdDegree = nodes.filter((node) => node.degree === 3);

  firstDegree.forEach((node, index) => {
    if (graphHasEdge(edges, "me", node.id)) return;
    link("me", node.id, 0.42 + randomFor(`me-${node.id}`) * 0.38, 0.62 + randomFor(`conf-${node.id}`) * 0.34, "直接の接点");
    if (index % 2 === 0) {
      const peer = firstDegree[(index + 3) % firstDegree.length];
      link(node.id, peer.id, 0.28 + randomFor(`peer-${node.id}`) * 0.36, 0.48 + randomFor(`peer-c-${node.id}`) * 0.32, "共通コミュニティ");
    }
  });

  secondDegree.forEach((node, index) => {
    const same = firstDegree.filter((candidate) => candidate.category === node.category);
    const source = same[index % Math.max(same.length, 1)] || firstDegree[index % firstDegree.length];
    if (!graphHasEdge(edges, source.id, node.id)) {
      link(source.id, node.id, 0.34 + randomFor(`second-${node.id}`) * 0.42, 0.5 + randomFor(`second-c-${node.id}`) * 0.42, "紹介候補");
    }
    if (index % 3 === 0) {
      const another = firstDegree[(index + 5) % firstDegree.length];
      link(another.id, node.id, 0.24 + randomFor(`cross-${node.id}`) * 0.35, 0.42 + randomFor(`cross-c-${node.id}`) * 0.32, "弱い接点");
    }
  });

  thirdDegree.forEach((node, index) => {
    const preferred = secondDegree.filter((candidate) => candidate.category === node.category || candidate.category === "founder");
    const source = preferred[index % Math.max(preferred.length, 1)] || secondDegree[index % secondDegree.length];
    if (!graphHasEdge(edges, source.id, node.id)) {
      link(source.id, node.id, 0.3 + randomFor(`third-${node.id}`) * 0.42, 0.45 + randomFor(`third-c-${node.id}`) * 0.42, "遠い紹介候補");
    }
  });

  for (let index = 0; index < 28; index += 1) {
    const a = nodes[1 + Math.floor(randomFor(`extra-a-${index}`) * (nodes.length - 1))];
    const b = nodes[1 + Math.floor(randomFor(`extra-b-${index}`) * (nodes.length - 1))];
    if (a.id !== b.id && Math.abs(a.degree - b.degree) <= 1 && !graphHasEdge(edges, a.id, b.id)) {
      link(a.id, b.id, 0.18 + randomFor(`extra-s-${index}`) * 0.42, 0.38 + randomFor(`extra-c-${index}`) * 0.45, "周辺接点");
    }
  }

  return { nodes, edges };
}

function person(id, name, title, category, degree, influence) {
  return { id, name, title, category, degree, influence };
}

function graphHasEdge(edges, source, target) {
  return edges.some((edge) => {
    return (edge.source === source && edge.target === target) || (edge.source === target && edge.target === source);
  });
}

function randomFor(key) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return ((hash >>> 0) % 10000) / 10000;
}

function initializePositions() {
  for (const node of graph.nodes) {
    const anchor = anchorFor(node);
    node.anchorX = anchor.x;
    node.anchorY = anchor.y;
    node.x = (randomFor(`${node.id}-x`) - 0.5) * 34;
    node.y = (randomFor(`${node.id}-y`) - 0.5) * 34;
    node.targetX = anchor.x + (randomFor(`${node.id}-tx`) - 0.5) * 140;
    node.targetY = anchor.y + (randomFor(`${node.id}-ty`) - 0.5) * 140;
    node.vx = 0;
    node.vy = 0;
    node.radius = radiusFor(node);
  }
}

function anchorFor(node) {
  if (node.degree === 0) return { x: 0, y: 0 };
  const category = CATEGORIES[node.category] || CATEGORIES.other;
  const distance = 115 + node.degree * 104;
  const skew = (randomFor(`${node.id}-skew`) - 0.5) * 0.48;
  return {
    x: Math.cos(category.angle + skew) * distance,
    y: Math.sin(category.angle + skew) * distance,
  };
}

function radiusFor(node) {
  if (node.degree === 0) return 18;
  return 6.5 + Math.sqrt(node.influence) * 1.15;
}

function buildCategoryControls() {
  categoryFilters.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, category]) => {
    const label = document.createElement("label");
    label.className = "category-option";
    label.innerHTML = `
      <span class="category-name">
        <span class="swatch" style="color: ${category.color}; background: ${category.color}"></span>
        ${category.label}
      </span>
      <input type="checkbox" data-category="${key}" checked />
    `;
    categoryFilters.appendChild(label);
  });
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("click", onCanvasClick);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  [filterHotspot, filterTab, filterTray].forEach((element) => {
    element.addEventListener("mouseenter", openFilters);
    element.addEventListener("mouseleave", scheduleCloseFilters);
    element.addEventListener("focusin", openFilters);
    element.addEventListener("focusout", scheduleCloseFilters);
  });

  pinFilters.addEventListener("click", () => {
    state.filterPinned = !state.filterPinned;
    pinFilters.classList.toggle("is-active", state.filterPinned);
    pinFilters.setAttribute("aria-pressed", String(state.filterPinned));
    if (state.filterPinned) openFilters();
  });

  filterTab.addEventListener("click", () => {
    state.filterPinned = !state.filterPinned;
    pinFilters.classList.toggle("is-active", state.filterPinned);
    pinFilters.setAttribute("aria-pressed", String(state.filterPinned));
    filterTray.classList.toggle("is-open", state.filterPinned);
    filterTab.setAttribute("aria-expanded", String(state.filterPinned));
  });

  document.querySelectorAll("[data-degree]").forEach((input) => {
    input.addEventListener("change", () => {
      const degree = Number(input.dataset.degree);
      if (input.checked) state.filter.degrees.add(degree);
      else state.filter.degrees.delete(degree);
    });
  });

  categoryFilters.addEventListener("change", (event) => {
    const input = event.target.closest("[data-category]");
    if (!input) return;
    const category = input.dataset.category;
    if (input.checked) state.filter.categories.add(category);
    else state.filter.categories.delete(category);
  });

  strengthRange.addEventListener("input", () => {
    state.filter.minStrength = Number(strengthRange.value);
    strengthValue.textContent = state.filter.minStrength.toFixed(2);
  });

  confidenceRange.addEventListener("input", () => {
    state.filter.minConfidence = Number(confidenceRange.value);
    confidenceValue.textContent = state.filter.minConfidence.toFixed(2);
  });

  resetButton.addEventListener("click", resetView);
  closeInspector.addEventListener("click", () => selectNode(null));

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;
    const match = graph.nodes.find((node) => {
      return `${node.name} ${node.title} ${CATEGORIES[node.category].label}`.toLowerCase().includes(query);
    });
    if (match) {
      selectNode(match);
      centerOn(match);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (filterTray.classList.contains("is-open") && !state.filterPinned) {
        closeFilters();
      } else {
        selectNode(null);
      }
    }
  });
}

function resizeCanvas() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  if (!state.view.x && !state.view.y) resetView();
}

function resetView() {
  state.view.x = state.width / 2;
  state.view.y = state.height / 2 + 26;
  state.view.k = Math.min(1.08, Math.max(0.82, state.width / 1440));
  selectNode(null);
}

function onPointerDown(event) {
  if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
  updateMouse(event);
  const node = findNodeAt(state.mouse.worldX, state.mouse.worldY);
  state.dragStart = { x: event.clientX, y: event.clientY };
  if (node) {
    state.dragNode = node;
    state.isDraggingNode = true;
    node.fx = node.x;
    node.fy = node.y;
  } else {
    state.isPanning = true;
  }
  canvas.classList.add("is-dragging");
}

function onPointerMove(event) {
  updateMouse(event);
  if (state.isPanning) {
    state.view.x += event.movementX;
    state.view.y += event.movementY;
    hideTooltip();
    return;
  }

  if (state.isDraggingNode && state.dragNode) {
    state.dragNode.x = state.mouse.worldX;
    state.dragNode.y = state.mouse.worldY;
    state.dragNode.fx = state.mouse.worldX;
    state.dragNode.fy = state.mouse.worldY;
    state.dragNode.vx = 0;
    state.dragNode.vy = 0;
    hideTooltip();
    return;
  }

  const hovered = findNodeAt(state.mouse.worldX, state.mouse.worldY);
  state.hoveredNode = hovered;
  canvas.style.cursor = hovered ? "pointer" : "grab";
  if (hovered) showTooltip(hovered, event.clientX, event.clientY);
  else hideTooltip();
}

function onPointerUp(event) {
  try {
    if (canvas.releasePointerCapture) canvas.releasePointerCapture(event.pointerId);
  } catch (error) {
    // Pointer capture can already be released by the browser.
  }
  if (state.dragNode) {
    delete state.dragNode.fx;
    delete state.dragNode.fy;
  }
  state.isPanning = false;
  state.isDraggingNode = false;
  state.dragNode = null;
  canvas.classList.remove("is-dragging");
}

function onCanvasClick(event) {
  const moved = Math.hypot(event.clientX - state.dragStart.x, event.clientY - state.dragStart.y) > 6;
  if (moved) return;
  updateMouse(event);
  const node = findNodeAt(state.mouse.worldX, state.mouse.worldY);
  if (node) selectNode(node);
}

function onWheel(event) {
  event.preventDefault();
  const before = screenToWorld(event.clientX, event.clientY);
  const scale = Math.exp(-event.deltaY * 0.0012);
  state.view.k = clamp(state.view.k * scale, 0.42, 2.4);
  const after = worldToScreen(before.x, before.y);
  state.view.x += event.clientX - after.x;
  state.view.y += event.clientY - after.y;
}

function updateMouse(event) {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
  const world = screenToWorld(event.clientX, event.clientY);
  state.mouse.worldX = world.x;
  state.mouse.worldY = world.y;
}

function screenToWorld(x, y) {
  return {
    x: (x - state.view.x) / state.view.k,
    y: (y - state.view.y) / state.view.k,
  };
}

function worldToScreen(x, y) {
  return {
    x: x * state.view.k + state.view.x,
    y: y * state.view.k + state.view.y,
  };
}

function findNodeAt(x, y) {
  let closest = null;
  let closestDistance = Infinity;
  for (const node of graph.nodes) {
    const distance = Math.hypot(node.x - x, node.y - y);
    const hitRadius = (node.radius + 8) / Math.sqrt(state.view.k);
    if (distance < hitRadius && distance < closestDistance) {
      closest = node;
      closestDistance = distance;
    }
  }
  return closest;
}

function openFilters() {
  filterTray.classList.add("is-open");
  filterTab.setAttribute("aria-expanded", "true");
}

function closeFilters() {
  if (state.filterPinned) return;
  filterTray.classList.remove("is-open");
  filterTab.setAttribute("aria-expanded", "false");
}

function scheduleCloseFilters() {
  window.setTimeout(() => {
    if (
      state.filterPinned ||
      filterTray.matches(":hover") ||
      filterHotspot.matches(":hover") ||
      filterTab.matches(":hover") ||
      filterTray.contains(document.activeElement)
    ) {
      return;
    }
    closeFilters();
  }, 150);
}

function selectNode(node) {
  state.selectedNode = node;
  state.route = node ? shortestPath("me", node.id) : [];
  state.routeEdges = new Set();
  for (let index = 0; index < state.route.length - 1; index += 1) {
    state.routeEdges.add(edgeKey(state.route[index], state.route[index + 1]));
  }
  updateInspector();
}

function updateInspector() {
  const node = state.selectedNode;
  inspector.classList.toggle("is-open", Boolean(node));
  if (!node) return;

  document.getElementById("personName").textContent = node.name;
  document.getElementById("personTitle").textContent = `${node.title} / ${CATEGORIES[node.category].label}`;
  document.getElementById("personInfluence").textContent = String(node.influence);
  document.getElementById("personDegree").textContent = node.degree === 0 ? "Me" : `${node.degree}次`;

  const routeList = document.getElementById("routeList");
  routeList.innerHTML = "";
  const route = state.route.length ? state.route : [node.id];
  route.forEach((id, index) => {
    const routeNode = nodesById.get(id);
    const item = document.createElement("li");
    item.dataset.step = String(index + 1);
    item.innerHTML = `<strong>${routeNode.name}</strong><br><span>${routeNode.title}</span>`;
    routeList.appendChild(item);
  });
}

function centerOn(node) {
  const target = worldToScreen(node.x, node.y);
  state.view.x += state.width / 2 - target.x;
  state.view.y += state.height / 2 - target.y;
}

function shortestPath(startId, targetId) {
  if (startId === targetId) return [startId];
  const distances = new Map();
  const previous = new Map();
  const queue = new Set(graph.nodes.map((node) => node.id));
  graph.nodes.forEach((node) => distances.set(node.id, Infinity));
  distances.set(startId, 0);

  while (queue.size) {
    let current = null;
    let best = Infinity;
    queue.forEach((id) => {
      const distance = distances.get(id);
      if (distance < best) {
        best = distance;
        current = id;
      }
    });
    if (current === null || current === targetId) break;
    queue.delete(current);

    for (const edge of graph.edges) {
      if (edge.source !== current && edge.target !== current) continue;
      const neighbor = edge.source === current ? edge.target : edge.source;
      if (!queue.has(neighbor)) continue;
      const cost = 1 / Math.max(edge.strength, 0.05);
      const confidencePenalty = 1 + (1 - edge.confidence) * 0.35;
      const candidate = distances.get(current) + cost * confidencePenalty;
      if (candidate < distances.get(neighbor)) {
        distances.set(neighbor, candidate);
        previous.set(neighbor, current);
      }
    }
  }

  if (!previous.has(targetId)) return [targetId];
  const path = [targetId];
  let cursor = targetId;
  while (previous.has(cursor)) {
    cursor = previous.get(cursor);
    path.unshift(cursor);
  }
  return path;
}

function frame(now) {
  tickSimulation();
  draw(now || 0);
  requestAnimationFrame(frame);
}

function tickSimulation() {
  const time = performance.now();
  for (const edge of graph.edges) {
    const source = edge.sourceNode;
    const target = edge.targetNode;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const desired = 74 + (1 - edge.strength) * 120 + Math.abs(source.degree - target.degree) * 18;
    const force = (distance - desired) * 0.0018 * (0.45 + edge.strength);
    const fx = dx * force;
    const fy = dy * force;
    if (source.degree !== 0) {
      source.vx += fx;
      source.vy += fy;
    }
    if (target.degree !== 0) {
      target.vx -= fx;
      target.vy -= fy;
    }
  }

  for (let i = 0; i < graph.nodes.length; i += 1) {
    const a = graph.nodes[i];
    for (let j = i + 1; j < graph.nodes.length; j += 1) {
      const b = graph.nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distanceSq = Math.max(80, dx * dx + dy * dy);
      const distance = Math.sqrt(distanceSq);
      const force = 70 / distanceSq;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      if (a.degree !== 0) {
        a.vx -= fx;
        a.vy -= fy;
      }
      if (b.degree !== 0) {
        b.vx += fx;
        b.vy += fy;
      }
    }
  }

  for (const node of graph.nodes) {
    const anchor = {
      x: node.targetX,
      y: node.targetY,
    };
    const drift = 8 + node.degree * 2;
    const breatheX = Math.sin(time * 0.00045 + randomFor(`${node.id}-phase`) * 8) * drift;
    const breatheY = Math.cos(time * 0.00038 + randomFor(`${node.id}-phase-b`) * 8) * drift;
    const pull = node.degree === 0 ? 0.06 : 0.0048;
    node.vx += (anchor.x + breatheX - node.x) * pull;
    node.vy += (anchor.y + breatheY - node.y) * pull;
    node.vx *= 0.88;
    node.vy *= 0.88;
    if (node.fx !== undefined) {
      node.x = node.fx;
      node.y = node.fy;
    } else {
      node.x += node.vx;
      node.y += node.vy;
    }
  }
}

function draw(now) {
  if (bootStatus) bootStatus.classList.add("is-hidden");
  ctx.save();
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.clearRect(0, 0, state.width, state.height);

  drawBackdrop();

  ctx.translate(state.view.x, state.view.y);
  ctx.scale(state.view.k, state.view.k);
  drawEdges(now);
  drawNodes();
  ctx.restore();
}

function drawBackdrop() {
  const gradient = ctx.createRadialGradient(
    state.width * 0.5,
    state.height * 0.48,
    80,
    state.width * 0.5,
    state.height * 0.48,
    Math.max(state.width, state.height) * 0.6,
  );
  gradient.addColorStop(0, "rgba(90, 116, 190, 0.12)");
  gradient.addColorStop(0.5, "rgba(18, 24, 38, 0.08)");
  gradient.addColorStop(1, "rgba(8, 10, 15, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawEdges(now) {
  const intro = introProgress(now);
  ctx.lineCap = "round";
  for (const edge of graph.edges) {
    const source = edge.sourceNode;
    const target = edge.targetNode;
    const sourcePoint = renderPoint(source, now);
    const targetPoint = renderPoint(target, now);
    const route = state.routeEdges.has(edgeKey(source.id, target.id));
    const active = isEdgeActive(edge);
    const selectedContext = isInSelectedContext(source.id, target.id);
    const hasSelection = Boolean(state.selectedNode);
    const alpha = (route
      ? 1
      : hasSelection
        ? selectedContext
          ? active
            ? 0.52
            : 0.12
          : 0.05
        : active
          ? 0.38 + edge.confidence * 0.28
          : 0.08) * intro;
    const width = route ? 6.6 : 0.7 + edge.strength * 5.3;
    const color = route ? "#F8F5D7" : edgeColor(edge);

    if (route) {
      ctx.beginPath();
      ctx.strokeStyle = hexToRgba(color, 0.18);
      ctx.lineWidth = width + 12;
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      ctx.lineTo(targetPoint.x, targetPoint.y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = width;
    ctx.moveTo(sourcePoint.x, sourcePoint.y);
    ctx.lineTo(targetPoint.x, targetPoint.y);
    ctx.stroke();

    if (route) drawParticle(sourcePoint, targetPoint, now, color);
  }
}

function drawParticle(source, target, now, color) {
  const phase = ((now * 0.00045 + randomFor(`${source.id}-${target.id}`)) % 1);
  const x = source.x + (target.x - source.x) * phase;
  const y = source.y + (target.y - source.y) * phase;
  ctx.beginPath();
  ctx.fillStyle = hexToRgba(color, 0.92);
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.arc(x, y, 3.8 / Math.sqrt(state.view.k), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawNodes() {
  const now = performance.now();
  const intro = introProgress(now);
  const sorted = [...graph.nodes].sort((a, b) => a.degree - b.degree);
  for (const node of sorted) {
    const point = renderPoint(node, now);
    const active = isNodeActive(node);
    const hovered = state.hoveredNode && state.hoveredNode.id === node.id;
    const selected = state.selectedNode && state.selectedNode.id === node.id;
    const inRoute = state.route.includes(node.id);
    const inContext = isNodeInSelectedContext(node.id);
    const dimmedBySelection = state.selectedNode && !inContext && !inRoute && !selected;
    const alpha = (inRoute || selected ? 1 : hovered ? 0.96 : dimmedBySelection ? 0.15 : active ? 0.82 : 0.12) * intro;
    const radius = node.radius * (selected ? 1.18 : hovered ? 1.12 : 1) * (0.72 + intro * 0.28);
    const color = CATEGORIES[node.category].color;

    if (selected || hovered || inRoute || node.id === "me") {
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(color, selected ? 0.22 : 0.12);
      ctx.arc(point.x, point.y, radius + 14, 0, Math.PI * 2);
      ctx.fill();
    }

    const gradient = ctx.createRadialGradient(
      point.x - radius * 0.32,
      point.y - radius * 0.42,
      radius * 0.15,
      point.x,
      point.y,
      radius,
    );
    gradient.addColorStop(0, hexToRgba("#FFFFFF", alpha * 0.72));
    gradient.addColorStop(0.3, hexToRgba(color, alpha));
    gradient.addColorStop(1, hexToRgba(color, alpha * 0.58));

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(node.degree === 0 ? "#F8F5D7" : color, Math.min(1, alpha + 0.2));
    ctx.lineWidth = node.degree === 1 ? 2.2 : node.degree === 2 ? 1.3 : node.degree === 3 ? 1 : 2.6;
    if (node.degree === 3) ctx.setLineDash([3, 4]);
    ctx.arc(point.x, point.y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (shouldDrawLabel(node, hovered, selected, inRoute)) {
      drawLabel(node, point, radius, alpha);
    }
  }
}

function shouldDrawLabel(node, hovered, selected, inRoute) {
  return (
    selected ||
    hovered ||
    inRoute ||
    node.degree === 0 ||
    node.influence > 90 ||
    (state.view.k > 1.35 && node.influence > 76)
  );
}

function drawLabel(node, point, radius, alpha) {
  const name = node.name;
  const category = CATEGORIES[node.category].label;
  ctx.font = `${node.degree === 0 ? 700 : 650} ${12 / Math.sqrt(state.view.k)}px Inter, system-ui, sans-serif`;
  const textWidth = Math.max(ctx.measureText(name).width, ctx.measureText(category).width);
  const padX = 8 / Math.sqrt(state.view.k);
  const boxWidth = textWidth + padX * 2;
  const boxHeight = 33 / Math.sqrt(state.view.k);
  const x = point.x - boxWidth / 2;
  const y = point.y + radius + 9 / Math.sqrt(state.view.k);

  ctx.fillStyle = `rgba(8, 10, 15, ${0.48 * alpha})`;
  roundRect(ctx, x, y, boxWidth, boxHeight, 6 / Math.sqrt(state.view.k));
  ctx.fill();

  ctx.fillStyle = `rgba(245, 247, 251, ${Math.max(0.35, alpha)})`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(name, point.x, y + 5 / Math.sqrt(state.view.k));
  ctx.font = `${10 / Math.sqrt(state.view.k)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = `rgba(154, 164, 178, ${Math.max(0.35, alpha)})`;
  ctx.fillText(category, point.x, y + 19 / Math.sqrt(state.view.k));
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function isNodeActive(node) {
  if (node.degree === 0) return true;
  return state.filter.degrees.has(node.degree) && state.filter.categories.has(node.category);
}

function isEdgeActive(edge) {
  return (
    isNodeActive(edge.sourceNode) &&
    isNodeActive(edge.targetNode) &&
    edge.strength >= state.filter.minStrength &&
    edge.confidence >= state.filter.minConfidence
  );
}

function isNodeInSelectedContext(id) {
  if (!state.selectedNode) return true;
  if (state.selectedNode.id === id || id === "me") return true;
  return graph.edges.some((edge) => {
    const touchesSelected = edge.source === state.selectedNode.id || edge.target === state.selectedNode.id;
    const touchesNode = edge.source === id || edge.target === id;
    return touchesSelected && touchesNode;
  });
}

function isInSelectedContext(sourceId, targetId) {
  if (!state.selectedNode) return true;
  if (sourceId === state.selectedNode.id || targetId === state.selectedNode.id) return true;
  return state.routeEdges.has(edgeKey(sourceId, targetId));
}

function edgeKey(a, b) {
  return [a, b].sort().join("__");
}

function edgeColor(edge) {
  if (edge.sourceNode.category === "investor" || edge.targetNode.category === "investor") {
    return CATEGORIES.investor.color;
  }
  const category = CATEGORIES[edge.sourceNode.category] || CATEGORIES.other;
  return category.color;
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showTooltip(node, x, y) {
  tooltip.innerHTML = `<strong>${node.name}</strong><br>${node.title}<br>${node.degree === 0 ? "中心" : `${node.degree}次`} / Influence ${node.influence}`;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.add("is-visible");
}

function hideTooltip() {
  tooltip.classList.remove("is-visible");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function introProgress(now) {
  if (!state.startTime) return 1;
  const raw = clamp((now - state.startTime) / state.introDuration, 0, 1);
  return 1 - Math.pow(1 - raw, 3);
}

function renderPoint(node, now) {
  const phaseA = randomFor(`${node.id}-render-a`) * Math.PI * 2;
  const phaseB = randomFor(`${node.id}-render-b`) * Math.PI * 2;
  const amount = node.degree === 0 ? 2.4 : 3.8 + node.degree * 1.1;
  return {
    x: node.x + Math.sin(now * 0.0011 + phaseA) * amount,
    y: node.y + Math.cos(now * 0.0009 + phaseB) * amount,
  };
}
