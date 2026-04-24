import { Link2, LogOut, Route, RotateCcw, Upload } from "lucide-react";
import {
  RELATIONSHIP_TYPES,
  relationshipTypeIds,
} from "../domain/relationshipTypes";
import type { RelationshipMap, RelationshipTypeId } from "../domain/types";
import type { MockSession, SocialConnections } from "../lib/auth";
import type {
  ApproachSuggestion,
  RelationshipPlatform,
} from "../lib/demoRelationshipMap";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | null;

interface SidebarProps {
  map: RelationshipMap;
  searchQuery: string;
  visibleTypes: Set<RelationshipTypeId>;
  selected: Selection;
  error: string | null;
  session: MockSession;
  socialConnections: SocialConnections;
  approach: ApproachSuggestion;
  platformCounts: Record<RelationshipPlatform, number>;
  onImportJson: (file: File) => void;
  onLoadSample: () => void;
  onLogout: () => void;
  onSearchChange: (query: string) => void;
  onTogglePlatform: (platform: keyof SocialConnections) => void;
  onToggleType: (type: RelationshipTypeId) => void;
}

export function Sidebar({
  map,
  searchQuery,
  visibleTypes,
  selected,
  error,
  session,
  socialConnections,
  approach,
  platformCounts,
  onImportJson,
  onLoadSample,
  onLogout,
  onSearchChange,
  onTogglePlatform,
  onToggleType,
}: SidebarProps) {
  const nodeById = new Map(map.nodes.map((node) => [node.id, node]));
  const selectedNode =
    selected?.kind === "node"
      ? map.nodes.find((node) => node.id === selected.id)
      : null;
  const selectedEdge =
    selected?.kind === "edge"
      ? map.edges.find((edge) => edge.id === selected.id)
      : null;

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <p className="eyebrow">Relationship Map</p>
        <h1>{map.title}</h1>
        <p>
          {map.nodes.length} nodes / {map.edges.length} relationships
        </p>
      </div>

      <section className="panel session-panel">
        <div className="session-row">
          <div>
            <h2>Session</h2>
            <strong>{session.user.name}</strong>
            <span>{session.user.title}</span>
          </div>
          <button
            aria-label="Logout"
            className="icon-button"
            title="Logout"
            type="button"
            onClick={onLogout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>SNS Connect</h2>
        <div className="social-toggle-list">
          <button
            className={`social-toggle ${socialConnections.linkedin ? "is-active" : ""}`}
            type="button"
            onClick={() => onTogglePlatform("linkedin")}
          >
            <Link2 size={16} />
            <span>
              <strong>LinkedIn</strong>
              <small>{platformCounts.linkedin} lines</small>
            </span>
          </button>
          <button
            className={`social-toggle ${socialConnections.facebook ? "is-active" : ""}`}
            type="button"
            onClick={() => onTogglePlatform("facebook")}
          >
            <Link2 size={16} />
            <span>
              <strong>Facebook</strong>
              <small>{platformCounts.facebook} lines</small>
            </span>
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>JSON Import</h2>
        <label className="file-button">
          <Upload size={16} />
          <span>JSONを読み込む</span>
          <input
            accept="application/json,.json"
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) onImportJson(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button className="secondary-button" type="button" onClick={onLoadSample}>
          <RotateCcw size={16} />
          サンプルに戻す
        </button>
        {error ? <p className="import-error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Search</h2>
        <input
          className="search-input"
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder="名前・肩書き・タグで検索"
          value={searchQuery}
        />
      </section>

      <section className="panel">
        <h2>Legend</h2>
        <div className="legend-list">
          {relationshipTypeIds.map((typeId) => {
            const type = RELATIONSHIP_TYPES[typeId];

            return (
              <label className="legend-row" key={typeId}>
                <input
                  checked={visibleTypes.has(typeId)}
                  type="checkbox"
                  onChange={() => onToggleType(typeId)}
                />
                <span
                  className="legend-swatch"
                  style={{ background: type.color }}
                />
                <span>{type.label}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Details</h2>
        {selectedNode ? (
          <div className="details">
            <strong>{selectedNode.name}</strong>
            {selectedNode.subtitle ? <span>{selectedNode.subtitle}</span> : null}
            {selectedNode.note ? <p>{selectedNode.note}</p> : null}
          </div>
        ) : selectedEdge ? (
          <div className="details">
            <strong>
              {selectedEdge.label ?? RELATIONSHIP_TYPES[selectedEdge.type].label}
            </strong>
            <span>
              {nodeById.get(selectedEdge.from)?.name ?? selectedEdge.from} {"->"}{" "}
              {nodeById.get(selectedEdge.to)?.name ?? selectedEdge.to}
            </span>
            {selectedEdge.note ? <p>{selectedEdge.note}</p> : null}
          </div>
        ) : (
          <p className="muted">ノードか線を選択してください。</p>
        )}
      </section>

      <section className="panel">
        <h2>Recommended Path</h2>
        <div className="path-detail">
          <Route size={17} />
          <strong>
            {approach.recommendedPath
              .map((id) => nodeById.get(id)?.name ?? id)
              .join(" -> ")}
          </strong>
          <span>Introducer: {approach.recommendedIntroducer}</span>
          <span>Score: {approach.score}</span>
        </div>
        <div className="strategy-copy">
          <p>{approach.introRequest}</p>
        </div>
      </section>
    </aside>
  );
}
