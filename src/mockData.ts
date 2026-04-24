export type NodeType = "self" | "contact" | "target" | "company" | "community";

export type PersonNode = {
  id: string;
  name: string;
  title: string;
  company: string;
  type: NodeType;
  x: number;
  y: number;
  source: "LinkedIn" | "Facebook" | "Google" | "Manual";
  summary: string;
};

export type RelationshipType =
  | "LinkedIn connection"
  | "Worked together"
  | "Met recently"
  | "Strong introducer";

export type RelationshipEdge = {
  id: string;
  from: string;
  to: string;
  type: RelationshipType;
  strength: number;
  recency: string;
  frequency: string;
  evidence: string[];
};

export type ApproachSuggestion = {
  targetId: string;
  recommendedPath: string[];
  recommendedIntroducer: string;
  score: number;
  whyThisPath: string[];
  introRequest: string;
  firstMessage: string;
  risks: string[];
};

export const nodes: PersonNode[] = [
  {
    id: "me",
    name: "自分",
    title: "事業開発",
    company: "Independent",
    type: "self",
    x: 110,
    y: 280,
    source: "Manual",
    summary: "新規事業とパートナー開拓を担当。紹介経由で意思決定者に接触したい。",
  },
  {
    id: "tanaka",
    name: "田中 美咲",
    title: "Product Lead",
    company: "Northstar Labs",
    type: "contact",
    x: 300,
    y: 170,
    source: "LinkedIn",
    summary: "LinkedIn 1次接続。過去プロジェクトで協働し、紹介依頼に反応しやすい。",
  },
  {
    id: "sato",
    name: "佐藤 蓮",
    title: "Partner Manager",
    company: "Orbit Partners",
    type: "contact",
    x: 510,
    y: 210,
    source: "Google",
    summary: "田中さんと直近イベントで同席。ターゲット企業への橋渡し役。",
  },
  {
    id: "kato",
    name: "加藤 葵",
    title: "Community Organizer",
    company: "Founders Table",
    type: "contact",
    x: 310,
    y: 395,
    source: "Facebook",
    summary: "共通コミュニティで接点あり。広いネットワークを持つが直近接触は薄い。",
  },
  {
    id: "yamamoto",
    name: "山本 悠",
    title: "VC Associate",
    company: "SeedGate Capital",
    type: "contact",
    x: 555,
    y: 415,
    source: "LinkedIn",
    summary: "投資家ネットワークに強い。ターゲットとの距離は近いが紹介文脈が弱い。",
  },
  {
    id: "target",
    name: "中村 俊",
    title: "Head of Alliances",
    company: "Aster AI",
    type: "target",
    x: 760,
    y: 280,
    source: "LinkedIn",
    summary: "今回アプローチしたい相手。Aster AIの提携責任者で、事業連携の決裁に近い。",
  },
  {
    id: "aster",
    name: "Aster AI",
    title: "Target company",
    company: "Aster AI",
    type: "company",
    x: 760,
    y: 105,
    source: "LinkedIn",
    summary: "ターゲット企業。AIワークフロー領域の成長企業。",
  },
  {
    id: "founders",
    name: "Founders Table",
    title: "Community",
    company: "Tokyo",
    type: "community",
    x: 520,
    y: 545,
    source: "Facebook",
    summary: "創業者・事業開発担当者のコミュニティ。弱い接点の発見に使える。",
  },
];

export const edges: RelationshipEdge[] = [
  {
    id: "me-tanaka",
    from: "me",
    to: "tanaka",
    type: "Strong introducer",
    strength: 92,
    recency: "直近14日以内",
    frequency: "月4回接触",
    evidence: ["LinkedIn 1次接続", "過去に2案件で協働", "Google Calendarで3回同席"],
  },
  {
    id: "tanaka-sato",
    from: "tanaka",
    to: "sato",
    type: "Met recently",
    strength: 78,
    recency: "直近30日以内",
    frequency: "イベント同席2回",
    evidence: ["Facebook共通イベント", "Google Calendarで同席", "共通コミュニティで接点"],
  },
  {
    id: "sato-target",
    from: "sato",
    to: "target",
    type: "Worked together",
    strength: 86,
    recency: "直近45日以内",
    frequency: "四半期に数回接触",
    evidence: ["LinkedIn 1次接続", "過去に提携案件で協働", "メール往復12スレッド"],
  },
  {
    id: "me-kato",
    from: "me",
    to: "kato",
    type: "LinkedIn connection",
    strength: 52,
    recency: "90日以上前",
    frequency: "年数回接触",
    evidence: ["Facebook友達", "Founders Tableで接点", "最近の直接接触は少ない"],
  },
  {
    id: "kato-yamamoto",
    from: "kato",
    to: "yamamoto",
    type: "Met recently",
    strength: 64,
    recency: "直近60日以内",
    frequency: "イベント同席3回",
    evidence: ["Facebook共通イベント", "同一コミュニティ所属"],
  },
  {
    id: "yamamoto-target",
    from: "yamamoto",
    to: "target",
    type: "LinkedIn connection",
    strength: 58,
    recency: "不明",
    frequency: "接触頻度低",
    evidence: ["LinkedIn 1次接続", "共通投資先の接点"],
  },
  {
    id: "target-aster",
    from: "target",
    to: "aster",
    type: "Worked together",
    strength: 95,
    recency: "現在",
    frequency: "所属",
    evidence: ["LinkedInプロフィール", "会社役職情報"],
  },
  {
    id: "kato-founders",
    from: "kato",
    to: "founders",
    type: "Strong introducer",
    strength: 88,
    recency: "現在",
    frequency: "運営メンバー",
    evidence: ["Facebookコミュニティ管理者", "イベント主催者"],
  },
  {
    id: "yamamoto-founders",
    from: "yamamoto",
    to: "founders",
    type: "Met recently",
    strength: 70,
    recency: "直近30日以内",
    frequency: "月1回参加",
    evidence: ["イベント参加履歴", "共通コミュニティ"],
  },
];

export const approachSuggestion: ApproachSuggestion = {
  targetId: "target",
  recommendedPath: ["me", "tanaka", "sato", "target"],
  recommendedIntroducer: "田中 美咲",
  score: 91,
  whyThisPath: [
    "自分と田中さんの関係が最も強く、紹介依頼への心理的ハードルが低い。",
    "田中さんから佐藤さんへの接点が直近30日以内で、話題化しやすい。",
    "佐藤さんは中村さんと提携案件で協働しており、事業連携の文脈で自然に接続できる。",
  ],
  introRequest:
    "田中さん、Aster AIの中村さんに事業連携の相談をしたく、佐藤さん経由でお繋ぎいただける可能性があるか相談させてください。中村さんの提携領域に近い提案なので、まずは15分だけ壁打ちできる形が理想です。",
  firstMessage:
    "中村さん、突然のご連絡失礼します。佐藤さん経由でご紹介いただきました。Aster AIの提携領域に関連して、既存顧客の導入接点を広げられる可能性があり、短くご相談できればと思っています。",
  risks: [
    "田中さんから中村さんへ直接ではなく、佐藤さんを挟むため紹介依頼が2段階になる。",
    "中村さんの直近優先テーマが不明なため、初回は売り込みではなく仮説相談に寄せる。",
  ],
};

export const highlightedEdgeIds = new Set(["me-tanaka", "tanaka-sato", "sato-target"]);
