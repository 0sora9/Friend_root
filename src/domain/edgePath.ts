export interface Point {
  x: number;
  y: number;
}

export function getEdgePath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const direction = dx >= 0 ? 1 : -1;
  const curve = Math.max(35, Math.min(140, Math.abs(dx) * 0.35));
  const c1 = { x: from.x + curve * direction, y: from.y - 40 };
  const c2 = { x: to.x - curve * direction, y: to.y + 40 };

  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}

export function getEdgeLabelPoint(from: Point, to: Point): Point {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 - 20,
  };
}
