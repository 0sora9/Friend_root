import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleDot,
  Link2,
  LogIn,
  LogOut,
  Mail,
  MessageSquareText,
  Network,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  authenticateMockUser,
  connectSocialProvider,
  demoCredentials,
  signInWithMockProvider,
  type MockUser,
  type SocialProvider,
} from "./lib/auth";
import {
  approachSuggestion,
  demoStats,
  edges,
  highlightedEdgeIds,
  nodes,
  socialIntegrations,
  type PersonNode,
  type RelationshipEdge,
  type RelationshipType,
} from "./mockData";

type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string };

const nodeById = new Map(nodes.map((node) => [node.id, node]));

const edgeTheme: Record<RelationshipType, { label: string; color: string }> = {
  "LinkedIn connection": { label: "LinkedIn", color: "#2563eb" },
  "Worked together": { label: "協働", color: "#0f766e" },
  "Met recently": { label: "最近接触", color: "#d97706" },
  "Strong introducer": { label: "強い紹介者", color: "#7c3aed" },
};

function getNodeClass(node: PersonNode) {
  return `graph-node graph-node-${node.type}`;
}

function getSelectedNode(selection: Selection): PersonNode | undefined {
  return selection.kind === "node" ? nodeById.get(selection.id) : undefined;
}

function getSelectedEdge(selection: Selection): RelationshipEdge | undefined {
  return selection.kind === "edge" ? edges.find((edge) => edge.id === selection.id) : undefined;
}

export default function App() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [selection, setSelection] = useState<Selection>({
    kind: "node",
    id: approachSuggestion.targetId,
  });
  const selectedNode = getSelectedNode(selection);
  const selectedEdge = getSelectedEdge(selection);
  const target = nodeById.get(approachSuggestion.targetId);

  const recommendedPathNames = useMemo(
    () => approachSuggestion.recommendedPath.map((id) => nodeById.get(id)?.name ?? id),
    [],
  );

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Friend Root Demo</p>
          <h1>{demoStats.scenarioTitle}</h1>
        </div>
        <div className="topbar-actions">
          <div className="search-box">
            <Search size={17} />
            <span>
              Target: {target?.name ?? "Unknown"} / {target?.company ?? "Network"}
            </span>
          </div>
          <button className="ghost-button" type="button" onClick={() => setUser(null)}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <IntegrationStrip
        user={user}
        onConnect={(provider) => setUser((current) =>
          current ? connectSocialProvider(current, provider) : current
        )}
      />

      <section className="workspace">
        <section className="map-panel" aria-label="Relationship Map">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Relationship Map</p>
              <h2>
                {demoStats.visiblePeopleCount} people / {demoStats.visibleRelationshipCount} relationships
              </h2>
            </div>
            <div className="legend">
              {Object.entries(edgeTheme).map(([key, item]) => (
                <span key={key}>
                  <i style={{ background: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <RelationshipMap selection={selection} onSelect={setSelection} />
        </section>

        <aside className="insight-panel">
          <TargetDetail selectedNode={selectedNode} selectedEdge={selectedEdge} />
          <ApproachStrategy pathNames={recommendedPathNames} />
        </aside>
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: MockUser) => void }) {
  const [email, setEmail] = useState(demoCredentials.email);
  const [password, setPassword] = useState(demoCredentials.password);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = authenticateMockUser({ email, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onLogin(result.user);
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Friend Root</p>
          <h1>紹介経路デモにログイン</h1>
          <p>
            LinkedIn / Facebook のモック連携データから、会いたい人までの関係性を表示します。
          </p>
        </div>

        <div className="social-login-row">
          <button type="button" onClick={() => onLogin(signInWithMockProvider("LinkedIn"))}>
            <Network size={18} />
            LinkedIn
          </button>
          <button type="button" onClick={() => onLogin(signInWithMockProvider("Facebook"))}>
            <Users size={18} />
            Facebook
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit">
            <LogIn size={18} />
            Demo Login
          </button>
        </form>
      </section>
    </main>
  );
}

function IntegrationStrip({
  user,
  onConnect,
}: {
  user: MockUser;
  onConnect: (provider: SocialProvider) => void;
}) {
  return (
    <section className="integration-strip" aria-label="Connected accounts">
      <div>
        <p className="eyebrow">Signed in</p>
        <strong>{user.name}</strong>
      </div>
      {socialIntegrations.map((integration) => {
        const provider = integration.provider as SocialProvider;
        const connected = user.connectedProviders.includes(provider);
        return (
          <button
            className={connected ? "integration-card is-connected" : "integration-card"}
            key={integration.provider}
            type="button"
            onClick={() => onConnect(provider)}
          >
            {connected ? <ShieldCheck size={18} /> : <Link2 size={18} />}
            <span>
              <strong>{integration.provider}</strong>
              {connected ? "Connected" : "Connect"} / {integration.syncedPeople} people
            </span>
          </button>
        );
      })}
    </section>
  );
}

function RelationshipMap({
  selection,
  onSelect,
}: {
  selection: Selection;
  onSelect: (selection: Selection) => void;
}) {
  return (
    <div className="graph-wrap">
      <svg className="graph" viewBox="0 0 900 620" role="img" aria-label="関係マップ">
        <defs>
          <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.14" />
          </filter>
        </defs>

        {edges.map((edge) => {
          const from = nodeById.get(edge.from)!;
          const to = nodeById.get(edge.to)!;
          const theme = edgeTheme[edge.type];
          const isHighlighted = highlightedEdgeIds.has(edge.id);
          const isSelected = selection.kind === "edge" && selection.id === edge.id;

          return (
            <g key={edge.id}>
              <line
                className={`graph-edge ${isHighlighted ? "is-highlighted" : ""} ${
                  isSelected ? "is-selected" : ""
                }`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={theme.color}
                strokeWidth={Math.max(2, edge.strength / 18)}
              />
              <line
                className="svg-hit-area"
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="transparent"
                strokeWidth="24"
                role="button"
                tabIndex={0}
                aria-label={`${from.name} と ${to.name} の関係を見る`}
                onClick={() => onSelect({ kind: "edge", id: edge.id })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onSelect({ kind: "edge", id: edge.id });
                  }
                }}
              />
            </g>
          );
        })}

        {nodes.map((node) => {
          const isSelected = selection.kind === "node" && selection.id === node.id;
          const isPath = approachSuggestion.recommendedPath.includes(node.id);
          const showLabel = isSelected || isPath || node.isFeatured || node.type !== "contact";
          const radius = isPath ? 34 : node.isFeatured ? 28 : 19;

          return (
            <g key={node.id} className={getNodeClass(node)}>
              <circle
                className={`${isSelected ? "is-selected" : ""} ${isPath ? "is-path" : ""}`}
                cx={node.x}
                cy={node.y}
                r={radius}
                role="button"
                tabIndex={0}
                aria-label={`${node.name} の詳細を見る`}
                onClick={() => onSelect({ kind: "node", id: node.id })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onSelect({ kind: "node", id: node.id });
                  }
                }}
              />
              <text
                className={showLabel ? "" : "node-label-muted"}
                x={node.x}
                y={node.y + radius + 17}
                textAnchor="middle"
              >
                {node.name}
              </text>
              <text
                className={showLabel ? "node-subtitle" : "node-subtitle node-label-muted"}
                x={node.x}
                y={node.y + radius + 33}
                textAnchor="middle"
              >
                {node.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TargetDetail({
  selectedNode,
  selectedEdge,
}: {
  selectedNode?: PersonNode;
  selectedEdge?: RelationshipEdge;
}) {
  const target = nodeById.get(approachSuggestion.targetId)!;

  return (
    <section className="detail-card">
      <div className="section-title">
        <CircleDot size={18} />
        <h2>Target Detail</h2>
      </div>

      {selectedEdge ? (
        <div className="selected-block">
          <p className="eyebrow">Selected Edge</p>
          <h3>
            {nodeById.get(selectedEdge.from)?.name} <ArrowRight size={17} />{" "}
            {nodeById.get(selectedEdge.to)?.name}
          </h3>
          <dl className="metric-grid">
            <div>
              <dt>関係種別</dt>
              <dd>{selectedEdge.type}</dd>
            </div>
            <div>
              <dt>強さ</dt>
              <dd>{selectedEdge.strength}/100</dd>
            </div>
            <div>
              <dt>最近接触</dt>
              <dd>{selectedEdge.recency}</dd>
            </div>
            <div>
              <dt>頻度</dt>
              <dd>{selectedEdge.frequency}</dd>
            </div>
          </dl>
          <EvidenceList evidence={selectedEdge.evidence} />
        </div>
      ) : (
        <div className="selected-block">
          <p className="eyebrow">Selected Node</p>
          <h3>{selectedNode?.name ?? target.name}</h3>
          <p className="profile-line">
            {selectedNode?.title ?? target.title} / {selectedNode?.company ?? target.company}
          </p>
          <p>{selectedNode?.summary ?? target.summary}</p>
          <dl className="metric-grid">
            <div>
              <dt>Source</dt>
              <dd>{selectedNode?.source ?? target.source}</dd>
            </div>
            <div>
              <dt>Community</dt>
              <dd>{selectedNode?.community ?? target.community}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="path-box">
        <Route size={18} />
        <div>
          <p className="eyebrow">Recommended Path</p>
          <strong>
            {approachSuggestion.recommendedPath
              .map((id) => nodeById.get(id)?.name ?? id)
              .join(" → ")}
          </strong>
        </div>
      </div>
    </section>
  );
}

function ApproachStrategy({ pathNames }: { pathNames: string[] }) {
  return (
    <section className="strategy-card">
      <div className="section-title">
        <Sparkles size={18} />
        <h2>Approach Strategy</h2>
        <span>AI Suggested</span>
      </div>

      <div className="score-row">
        <div>
          <p className="eyebrow">Success Score</p>
          <strong>{approachSuggestion.score}</strong>
        </div>
        <div>
          <p className="eyebrow">Introducer</p>
          <strong>{approachSuggestion.recommendedIntroducer}</strong>
        </div>
      </div>

      <div className="route-line">
        {pathNames.map((name, index) => (
          <span key={name}>
            {name}
            {index < pathNames.length - 1 ? <ArrowRight size={15} /> : null}
          </span>
        ))}
      </div>

      <div className="reason-list">
        {approachSuggestion.whyThisPath.map((reason) => (
          <div key={reason}>
            <BadgeCheck size={17} />
            <p>{reason}</p>
          </div>
        ))}
      </div>

      <MessageTemplate
        icon={<Mail size={18} />}
        title="紹介依頼文"
        body={approachSuggestion.introRequest}
      />
      <MessageTemplate
        icon={<MessageSquareText size={18} />}
        title="初回メッセージ案"
        body={approachSuggestion.firstMessage}
      />

      <div className="risk-box">
        <div className="section-title compact">
          <CalendarDays size={17} />
          <h3>注意点</h3>
        </div>
        {approachSuggestion.risks.map((risk) => (
          <p key={risk}>{risk}</p>
        ))}
      </div>
    </section>
  );
}

function EvidenceList({ evidence }: { evidence: string[] }) {
  return (
    <div className="evidence-list">
      <p className="eyebrow">Evidence</p>
      {evidence.map((item) => (
        <span key={item}>
          <Users size={15} />
          {item}
        </span>
      ))}
    </div>
  );
}

function MessageTemplate({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="message-template">
      <div className="section-title compact">
        {icon}
        <h3>{title}</h3>
      </div>
      <p>{body}</p>
    </div>
  );
}
