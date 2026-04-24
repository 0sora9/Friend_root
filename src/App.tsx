import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleDot,
  ExternalLink,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Network,
  Route,
  Search,
  ShieldCheck,
  Slack,
  Sparkles,
  Users,
  LogOut,
  Linkedin,
} from "lucide-react";
import {
  approachSuggestion,
  edges,
  highlightedEdgeIds,
  nodes,
  type PersonNode,
  type RelationshipEdge,
  type RelationshipType,
} from "./mockData";

type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string };

type DemoAccount = {
  email: string;
  password: string;
  name: string;
  role: string;
};

const demoAccounts: DemoAccount[] = [
  {
    email: "demo@froot.ai",
    password: "demo1234",
    name: "デモユーザー",
    role: "Business Development",
  },
  {
    email: "owner@froot.ai",
    password: "owner1234",
    name: "管理者ユーザー",
    role: "Workspace Owner",
  },
];

const defaultDemoAccount = demoAccounts[0]!;
const postLoginUrl = "http://127.0.0.1:5173/frontend/";

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
  const [email, setEmail] = useState(defaultDemoAccount.email);
  const [password, setPassword] = useState(defaultDemoAccount.password);
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<DemoAccount | null>(null);
  const [integrations, setIntegrations] = useState({
    linkedin: true,
    slack: false,
  });
  const [selection, setSelection] = useState<Selection>({ kind: "node", id: "target" });
  const selectedNode = getSelectedNode(selection);
  const selectedEdge = getSelectedEdge(selection);

  const recommendedPathNames = useMemo(
    () => approachSuggestion.recommendedPath.map((id) => nodeById.get(id)?.name ?? id),
    [],
  );

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const matchedAccount = demoAccounts.find(
      (account) => account.email === email.trim() && account.password === password,
    );

    if (!matchedAccount) {
      setLoginError("メールアドレスまたはパスワードが一致しません。");
      return;
    }

    setLoginError("");
    setCurrentUser(matchedAccount);
  }

  function fillDemoAccount(account: DemoAccount) {
    setEmail(account.email);
    setPassword(account.password);
    setLoginError("");
  }

  function toggleIntegration(key: "linkedin" | "slack") {
    setIntegrations((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function proceedToFrontend() {
    window.location.href = postLoginUrl;
  }

  if (!currentUser) {
    return (
      <main className="login-shell">
        <section className="login-panel" aria-label="Dummy Login">
          <div className="login-copy">
            <p className="eyebrow">FROOT Demo</p>
            <h1>ダミー環境ログイン</h1>
            <p>
              この画面はデモ用の疑似ログインです。認証APIやセッション連携は行わず、固定アカウントで画面遷移のみ確認できます。
            </p>

            <div className="login-feature-list">
              <div>
                <ShieldCheck size={18} />
                <span>固定アカウントで動作確認</span>
              </div>
              <div>
                <Network size={18} />
                <span>ログイン後に関係マップを表示</span>
              </div>
            </div>
          </div>

          <form className="login-card" onSubmit={handleLogin}>
            <div className="section-title">
              <LockKeyhole size={18} />
              <h2>Login</h2>
            </div>

            <div className="demo-account-list" aria-label="Demo Accounts">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  className="demo-account-button"
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                >
                  <strong>{account.name}</strong>
                  <span>
                    {account.email} / {account.role}
                  </span>
                </button>
              ))}
            </div>

            <label className="form-field">
              <span>メールアドレス</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="demo@froot.ai"
              />
            </label>

            <label className="form-field">
              <span>パスワード</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="demo1234"
              />
            </label>

            {loginError ? <p className="form-error">{loginError}</p> : null}

            <button className="primary-button" type="submit">
              ログイン
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <section className="integration-panel" aria-label="Dummy API Integrations">
        <div className="login-copy integration-copy">
          <p className="eyebrow">FROOT Demo</p>
          <h1>API連携設定</h1>
          <p>
            ログイン後の初期設定として、外部サービス連携の画面を追加しました。ここでは LinkedIn と
            Slack をダミーで ON/OFF できます。
          </p>

          <div className="login-feature-list">
            <div>
              <Linkedin size={18} />
              <span>LinkedIn から関係データを取得する想定</span>
            </div>
            <div>
              <Slack size={18} />
              <span>Slack の接点や会話ログを参照する想定</span>
            </div>
          </div>
        </div>

        <section className="login-card integration-card">
          <div className="session-header">
            <div>
              <p className="eyebrow">Signed In</p>
              <strong>{currentUser.name}</strong>
              <p className="integration-caption">{currentUser.email}</p>
            </div>
            <button className="ghost-action" type="button" onClick={() => setCurrentUser(null)}>
              <LogOut size={16} />
              Logout
            </button>
          </div>

          <div className="section-title">
            <Network size={18} />
            <h2>連携するサービス</h2>
          </div>

          <div className="integration-list">
            <IntegrationToggle
              name="LinkedIn"
              description="プロフィール、所属、接点のダミーデータを取り込む"
              icon={<Linkedin size={18} />}
              checked={integrations.linkedin}
              onToggle={() => toggleIntegration("linkedin")}
            />
            <IntegrationToggle
              name="Slack"
              description="チャンネル参加状況と会話履歴のダミーデータを参照する"
              icon={<Slack size={18} />}
              checked={integrations.slack}
              onToggle={() => toggleIntegration("slack")}
            />
          </div>

          <div className="integration-summary">
            <p className="eyebrow">Status</p>
            <strong>{Object.values(integrations).filter(Boolean).length} services enabled</strong>
            <p className="integration-caption">
              この画面はダミー実装です。トグル状態は UI 表示だけに使われ、実際の API 認可は行いません。
            </p>
          </div>

          <button className="primary-button" type="button" onClick={proceedToFrontend}>
            ダッシュボードへ進む
            <ExternalLink size={16} />
          </button>
        </section>
      </section>
    </main>
  );
}

function IntegrationToggle({
  name,
  description,
  icon,
  checked,
  onToggle,
}: {
  name: string;
  description: string;
  icon: ReactNode;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="integration-item">
      <div className="integration-meta">
        <div className="integration-icon">{icon}</div>
        <div>
          <strong>{name}</strong>
          <p>{description}</p>
        </div>
      </div>
      <button
        className={`toggle-button ${checked ? "is-on" : ""}`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${name} integration`}
        onClick={onToggle}
      >
        <span className="toggle-knob" />
      </button>
    </div>
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

          return (
            <g key={node.id} className={getNodeClass(node)}>
              <circle
                className={`${isSelected ? "is-selected" : ""} ${isPath ? "is-path" : ""}`}
                cx={node.x}
                cy={node.y}
                r={node.type === "company" || node.type === "community" ? 38 : 44}
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
              <text x={node.x} y={node.y + 5} textAnchor="middle">
                {node.name}
              </text>
              <text className="node-subtitle" x={node.x} y={node.y + 66} textAnchor="middle">
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
  const target = nodeById.get("target")!;

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
              <dt>Role</dt>
              <dd>{selectedNode?.type ?? target.type}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="path-box">
        <Route size={18} />
        <div>
          <p className="eyebrow">Recommended Path</p>
          <strong>自分 → 田中 美咲 → 佐藤 蓮 → 中村 俊</strong>
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
  icon: ReactNode;
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
