import { type FormEvent, useMemo, useState } from "react";
import { KeyRound, Link2, Network } from "lucide-react";
import demoData from "../data/human_relationship_demo.json";
import { RelationshipCanvas } from "./components/RelationshipCanvas";
import { Sidebar, type Selection } from "./components/Sidebar";
import { relationshipTypeIds } from "./domain/relationshipTypes";
import { parseRelationshipMap } from "./domain/schema";
import type { RelationshipMap, RelationshipTypeId } from "./domain/types";
import {
  createMockSession,
  demoCredentials,
  loginWithMockCredentials,
  type LoginProvider,
  type MockSession,
  type SocialConnections
} from "./lib/auth";
import {
  buildRelationshipMapFromDemoData,
  type DemoData
} from "./lib/demoRelationshipMap";

function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(String(reader.result ?? ""));
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Unable to read file."));
    });
    reader.readAsText(file);
  });
}

const initialConnections: SocialConnections = {
  linkedin: true,
  facebook: true
};

export default function App() {
  const [session, setSession] = useState<MockSession | null>(null);
  const [connections, setConnections] = useState<SocialConnections>(initialConnections);
  const [customMap, setCustomMap] = useState<RelationshipMap | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleTypes, setVisibleTypes] = useState<Set<RelationshipTypeId>>(
    () => new Set(relationshipTypeIds)
  );
  const [selected, setSelected] = useState<Selection>(null);
  const [error, setError] = useState<string | null>(null);

  const demoGraph = useMemo(
    () =>
      buildRelationshipMapFromDemoData(demoData as DemoData, {
        connectedPlatforms: connections,
        maxEdges: 30,
        maxNodes: 24
      }),
    [connections]
  );
  const map = customMap ?? demoGraph.map;

  async function handleImportJson(file: File) {
    try {
      const raw = await readFileText(file);
      const parsedJson = JSON.parse(raw);
      const result = parseRelationshipMap(parsedJson);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setCustomMap(result.data);
      setSelected(null);
      setError(null);
    } catch {
      setError("Invalid JSON syntax.");
    }
  }

  function handleToggleType(type: RelationshipTypeId) {
    setVisibleTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleTogglePlatform(platform: keyof SocialConnections) {
    setConnections((current) => {
      const next = { ...current, [platform]: !current[platform] };
      if (!next.linkedin && !next.facebook) return current;
      setSession((currentSession) =>
        currentSession ? { ...currentSession, connectedPlatforms: next } : currentSession
      );
      setCustomMap(null);
      setSelected(null);
      return next;
    });
  }

  function handleLogin(nextSession: MockSession) {
    setSession(nextSession);
    setConnections(nextSession.connectedPlatforms);
    setCustomMap(null);
    setSelected(null);
    setError(null);
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <main className="app-shell">
      <Sidebar
        approach={demoGraph.approach}
        error={error}
        map={map}
        platformCounts={demoGraph.platformCounts}
        searchQuery={searchQuery}
        selected={selected}
        session={session}
        socialConnections={connections}
        visibleTypes={visibleTypes}
        onImportJson={handleImportJson}
        onLoadSample={() => {
          setCustomMap(null);
          setSelected(null);
          setError(null);
        }}
        onLogout={() => setSession(null)}
        onSearchChange={setSearchQuery}
        onTogglePlatform={handleTogglePlatform}
        onToggleType={handleToggleType}
      />
      <RelationshipCanvas
        map={map}
        searchQuery={searchQuery}
        selected={selected}
        visibleTypes={visibleTypes}
        onSelect={setSelected}
      />
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (session: MockSession) => void }) {
  const [email, setEmail] = useState(demoCredentials.email);
  const [password, setPassword] = useState(demoCredentials.password);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSession = loginWithMockCredentials(email, password);
    if (!nextSession) {
      setError("デモ用ログイン情報が一致しません。");
      return;
    }
    onLogin(nextSession);
  }

  function providerLogin(provider: LoginProvider) {
    onLogin(createMockSession(provider));
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <Network size={30} />
          <div>
            <p className="eyebrow">Friend Root / frontend-4</p>
            <h1>関係経路デモへログイン</h1>
          </div>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label>
            Email
            <input
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
          </label>
          {error ? <span className="login-error">{error}</span> : null}
          <button type="submit">
            <KeyRound size={17} />
            Demo login
          </button>
        </form>

        <div className="provider-actions">
          <button type="button" onClick={() => providerLogin("linkedin")}>
            <Link2 size={17} />
            LinkedIn mock
          </button>
          <button type="button" onClick={() => providerLogin("facebook")}>
            <Link2 size={17} />
            Facebook mock
          </button>
        </div>
      </section>
    </main>
  );
}
