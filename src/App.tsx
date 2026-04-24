import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleDot,
  Link,
  LogOut,
  Mail,
  MessageSquareText,
  Route,
  Search,
  Sparkles,
  Users
} from "lucide-react";
import demoData from "../data/human_relationship_demo.json";
import {
  createMockSession,
  demoCredentials,
  loginWithMockCredentials,
  type LoginProvider,
  type MockSession
} from "./lib/auth";
import {
  buildDemoRelationshipGraph,
  type DemoData,
  type PersonNode,
  type RelationshipEdge,
  type RelationshipType,
  type SocialConnections
} from "./lib/demoGraph";
import { ThreeRelationshipMap } from "./ThreeRelationshipMap";

type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string };

const edgeTheme: Record<RelationshipType, { label: string; color: string }> = {
  "LinkedIn connection": { label: "LinkedIn", color: "#2563eb" },
  "Facebook friend": { label: "Facebook", color: "#db2777" },
  "Worked together": { label: "協働", color: "#0f766e" },
  "Community bridge": { label: "複合接点", color: "#d97706" },
  "Strong introducer": { label: "強い紹介者", color: "#7c3aed" }
};

export default function App() {
  const [session, setSession] = useState<MockSession | null>(null);
  const [connections, setConnections] = useState<SocialConnections>({ linkedin: true, facebook: true });
  const [selection, setSelection] = useState<Selection>({ kind: "node", id: "ren_ogasawara" });
  const [query, setQuery] = useState("");

  const graph = useMemo(
    () =>
      buildDemoRelationshipGraph(demoData as DemoData, {
        connectedPlatforms: session?.connectedPlatforms ?? connections
      }),
    [connections, session?.connectedPlatforms]
  );
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const selectedNode = selection.kind === "node" ? nodeById.get(selection.id) : undefined;
  const selectedEdge = selection.kind === "edge" ? graph.edges.find((edge) => edge.id === selection.id) : undefined;
  const pathNames = graph.approachSuggestion.recommendedPath.map((id) => nodeById.get(id)?.name ?? id);
  const searchResults = query.trim()
    ? graph.nodes
        .filter((node) =>
          [node.name, node.title, node.company, node.community].join(" ").toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6)
    : [];

  if (!session) {
    return (
      <LoginScreen
        onLogin={(nextSession) => {
          setSession(nextSession);
          setConnections(nextSession.connectedPlatforms);
        }}
      />
    );
  }

  const activeConnections = session.connectedPlatforms;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Friend Root Demo / frontend-3</p>
          <h1>LinkedInとFacebookの接点を統合し、会いたい人までの関係経路を作成</h1>
        </div>
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="人物・会社・コミュニティを検索"
            aria-label="人物・会社・コミュニティを検索"
          />
          {searchResults.length > 0 ? (
            <div className="search-results">
              {searchResults.map((node) => (
                <button key={node.id} type="button" onClick={() => setSelection({ kind: "node", id: node.id })}>
                  <strong>{node.name}</strong>
                  <span>{node.company}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button className="logout-button" type="button" onClick={() => setSession(null)}>
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <section className="integration-row" aria-label="SNS連携">
        <SocialConnectionCard
          label="LinkedIn"
          description="職歴、投資、事業開発、共通会社の接点を表示"
          active={activeConnections.linkedin}
          onToggle={() => {
            const next = { ...activeConnections, linkedin: !activeConnections.linkedin };
            setSession({ ...session, connectedPlatforms: next });
            setConnections(next);
          }}
        />
        <SocialConnectionCard
          label="Facebook"
          description="友人、イベント、コミュニティ、同窓接点を表示"
          active={activeConnections.facebook}
          onToggle={() => {
            const next = { ...activeConnections, facebook: !activeConnections.facebook };
            setSession({ ...session, connectedPlatforms: next });
            setConnections(next);
          }}
        />
        <div className="dataset-card">
          <strong>{graph.meta.peopleCount} people / {graph.meta.relationshipCount} relationships</strong>
          <span>{graph.scenarioTitle}</span>
        </div>
      </section>

      <section className="workspace">
        <section className="map-panel" aria-label="Relationship Map">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Relationship Map</p>
              <h2>{graph.edges.length} visible edges from repository demo data</h2>
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

          <ThreeRelationshipMap graph={graph} selection={selection} onSelect={setSelection} />
        </section>

        <aside className="insight-panel">
          <TargetDetail selectedNode={selectedNode} selectedEdge={selectedEdge} nodeById={nodeById} graph={graph} />
          <ApproachStrategy graph={graph} pathNames={pathNames} />
        </aside>
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (session: MockSession) => void }) {
  const [email, setEmail] = useState(demoCredentials.email);
  const [password, setPassword] = useState(demoCredentials.password);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = loginWithMockCredentials(email, password);
    if (!session) {
      setError("デモ用ログイン情報が一致しません。");
      return;
    }
    onLogin(session);
  }

  function providerLogin(provider: LoginProvider) {
    onLogin(createMockSession(provider));
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Friend Root</p>
        <h1>人間関係データをSNS接点として可視化</h1>
        <p>ログインとSNS連携はデモ用モックです。実際のLinkedIn/Facebook APIには接続しません。</p>
        <form onSubmit={submit} className="login-form">
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <span className="login-error">{error}</span> : null}
          <button type="submit">Demo login</button>
        </form>
        <div className="provider-actions">
          <button type="button" onClick={() => providerLogin("linkedin")}>Continue with LinkedIn mock</button>
          <button type="button" onClick={() => providerLogin("facebook")}>Continue with Facebook mock</button>
        </div>
      </section>
    </main>
  );
}

function SocialConnectionCard({
  label,
  description,
  active,
  onToggle
}: {
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button className={`social-card ${active ? "is-active" : ""}`} type="button" onClick={onToggle}>
      <Link size={17} />
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <em>{active ? "Connected" : "Off"}</em>
    </button>
  );
}

function TargetDetail({
  selectedNode,
  selectedEdge,
  nodeById,
  graph
}: {
  selectedNode?: PersonNode;
  selectedEdge?: RelationshipEdge;
  nodeById: Map<string, PersonNode>;
  graph: ReturnType<typeof buildDemoRelationshipGraph>;
}) {
  const target = nodeById.get(graph.approachSuggestion.targetId);

  return (
    <section className="detail-card">
      <div className="section-title">
        <CircleDot size={18} />
        <h2>Relationship Detail</h2>
      </div>

      {selectedEdge ? (
        <div className="selected-block">
          <p className="eyebrow">Selected Edge</p>
          <h3>
            {nodeById.get(selectedEdge.from)?.name} <ArrowRight size={17} /> {nodeById.get(selectedEdge.to)?.name}
          </h3>
          <dl className="metric-grid">
            <div><dt>SNS</dt><dd>{selectedEdge.platform}</dd></div>
            <div><dt>強さ</dt><dd>{selectedEdge.strength}/100</dd></div>
            <div><dt>開始</dt><dd>{selectedEdge.recency}</dd></div>
            <div><dt>方向</dt><dd>{selectedEdge.frequency}</dd></div>
          </dl>
          <EvidenceList evidence={selectedEdge.evidence} />
        </div>
      ) : (
        <div className="selected-block">
          <p className="eyebrow">Selected Node</p>
          <h3>{selectedNode?.name ?? target?.name}</h3>
          <p className="profile-line">{selectedNode?.title ?? target?.title} / {selectedNode?.company ?? target?.company}</p>
          <p>{selectedNode?.summary ?? target?.summary}</p>
          <dl className="metric-grid">
            <div><dt>Source</dt><dd>{selectedNode?.source ?? target?.source}</dd></div>
            <div><dt>Influence</dt><dd>{selectedNode?.influenceScore ?? target?.influenceScore}</dd></div>
          </dl>
        </div>
      )}

      <div className="path-box">
        <Route size={18} />
        <div>
          <p className="eyebrow">Recommended Path</p>
          <strong>{graph.approachSuggestion.recommendedPath.map((id) => nodeById.get(id)?.name ?? id).join(" → ")}</strong>
        </div>
      </div>
    </section>
  );
}

function ApproachStrategy({
  graph,
  pathNames
}: {
  graph: ReturnType<typeof buildDemoRelationshipGraph>;
  pathNames: string[];
}) {
  const suggestion = graph.approachSuggestion;

  return (
    <section className="strategy-card">
      <div className="section-title">
        <Sparkles size={18} />
        <h2>Approach Strategy</h2>
        <span>Mock AI</span>
      </div>

      <div className="score-row">
        <div>
          <p className="eyebrow">Success Score</p>
          <strong>{suggestion.score}</strong>
        </div>
        <div>
          <p className="eyebrow">Introducer</p>
          <strong>{suggestion.recommendedIntroducer}</strong>
        </div>
      </div>

      <div className="route-line">
        {pathNames.map((name, index) => (
          <span key={`${name}-${index}`}>
            {name}
            {index < pathNames.length - 1 ? <ArrowRight size={15} /> : null}
          </span>
        ))}
      </div>

      <div className="reason-list">
        {suggestion.whyThisPath.map((reason) => (
          <div key={reason}>
            <BadgeCheck size={17} />
            <p>{reason}</p>
          </div>
        ))}
      </div>

      <MessageTemplate icon={<Mail size={18} />} title="紹介依頼文" body={suggestion.introRequest} />
      <MessageTemplate icon={<MessageSquareText size={18} />} title="初回メッセージ案" body={suggestion.firstMessage} />

      <div className="risk-box">
        <div className="section-title compact">
          <CalendarDays size={17} />
          <h3>注意点</h3>
        </div>
        {suggestion.risks.map((risk) => (
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

function MessageTemplate({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
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
