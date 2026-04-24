import { useState, type CSSProperties } from "react";
import type { MapNode } from "../domain/types";

interface NodeCardProps {
  node: MapNode;
  selected: boolean;
  dimmed: boolean;
  onSelect: (nodeId: string) => void;
}

interface NodeCardStyle extends CSSProperties {
  "--node-color": string;
}

export function NodeCard({ node, selected, dimmed, onSelect }: NodeCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = node.name.slice(0, 1).toUpperCase();
  const color = node.color ?? "#0f8db3";
  const style: NodeCardStyle = {
    left: node.x,
    top: node.y,
    "--node-color": color,
  };

  return (
    <button
      aria-label={node.name}
      className={`node-card ${selected ? "is-selected" : ""} ${
        dimmed ? "is-dimmed" : ""
      }`}
      style={style}
      onClick={() => onSelect(node.id)}
      type="button"
    >
      <span className="node-avatar">
        {imageFailed ? (
          <span className="node-initial">{initial}</span>
        ) : (
          <img
            src={node.imageUrl}
            alt={node.name}
            onError={() => setImageFailed(true)}
          />
        )}
      </span>
      <span className="node-name">{node.name}</span>
      {node.subtitle ? <span className="node-subtitle">{node.subtitle}</span> : null}
      {node.tags?.length ? (
        <span className="node-tags">
          {node.tags.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
