import type { RelationshipTypeDefinition, RelationshipTypeId } from "./types";

export const relationshipTypeIds: RelationshipTypeId[] = [
  "couple",
  "friends",
  "former_friends",
  "rival",
  "family",
  "coworker",
  "admiration",
];

export const RELATIONSHIP_TYPES: Record<
  RelationshipTypeId,
  RelationshipTypeDefinition
> = {
  couple: {
    id: "couple",
    label: "強い紹介者",
    color: "#ef3f5f",
    icon: "♥",
    strokeWidth: 6,
    bidirectionalDefault: true,
  },
  friends: {
    id: "friends",
    label: "Facebook",
    color: "#f2b705",
    icon: "☺",
    strokeWidth: 4,
    dashArray: "7 7",
    bidirectionalDefault: true,
  },
  former_friends: {
    id: "former_friends",
    label: "休眠接点",
    color: "#28b8a7",
    icon: "☹",
    strokeWidth: 4,
    dashArray: "6 8",
    bidirectionalDefault: true,
  },
  rival: {
    id: "rival",
    label: "低信頼",
    color: "#a45586",
    icon: "?",
    strokeWidth: 5,
    bidirectionalDefault: true,
  },
  family: {
    id: "family",
    label: "複合接点",
    color: "#1f6f99",
    icon: "◆",
    strokeWidth: 5,
    bidirectionalDefault: true,
  },
  coworker: {
    id: "coworker",
    label: "LinkedIn",
    color: "#f28c28",
    icon: "...",
    strokeWidth: 4,
    dashArray: "5 6",
    bidirectionalDefault: true,
  },
  admiration: {
    id: "admiration",
    label: "ウォームイントロ",
    color: "#d94f91",
    icon: "♥",
    strokeWidth: 4,
    bidirectionalDefault: false,
  },
};
