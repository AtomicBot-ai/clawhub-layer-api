export interface ConvexQueryResponse<T> {
  status: 'success' | 'error';
  value?: T;
  errorMessage?: string;
}

export interface ConvexSkillBadges {
  highlighted?: { byUserId: string; at: number };
  official?: { byUserId: string; at: number };
  deprecated?: { byUserId: string; at: number };
}

export interface ConvexSkillStats {
  downloads: number;
  installsCurrent?: number;
  installsAllTime?: number;
  stars: number;
  versions: number;
  comments: number;
}

export interface ConvexListPageSkill {
  _id: string;
  _creationTime: number;
  slug: string;
  displayName: string;
  summary?: string;
  badges?: ConvexSkillBadges;
  stats: ConvexSkillStats;
  tags: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  ownerUserId?: string;
  ownerPublisherId?: string;
  latestVersionId?: string;
}

export interface ConvexListPageVersion {
  _id: string;
  _creationTime: number;
  version: string;
  changelog?: string;
  changelogSource?: string;
  createdAt: number;
  parsed?: ConvexParsedVersion;
}

export interface ConvexListPageOwner {
  _id: string;
  _creationTime: number;
  handle?: string;
  displayName?: string;
  image?: string;
  kind?: string;
  linkedUserId?: string;
}

export interface ConvexListPageItem {
  skill: ConvexListPageSkill;
  latestVersion: ConvexListPageVersion | null;
  owner: ConvexListPageOwner | null;
  ownerHandle: string | null;
}

export interface ConvexListPageResult {
  page: ConvexListPageItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ConvexFileEntry {
  path: string;
  size: number;
  sha256: string;
  contentType?: string;
}

export interface ConvexVtAnalysis {
  status: string;
  verdict?: string;
  analysis?: string;
  source?: string;
  checkedAt?: number;
}

export interface ConvexLlmDimension {
  name: string;
  label: string;
  rating: string;
  detail: string;
}

export interface ConvexLlmAnalysis {
  status: string;
  verdict?: string;
  confidence?: string;
  summary?: string;
  guidance?: string;
  model?: string;
  checkedAt?: number;
  dimensions?: ConvexLlmDimension[];
}

export interface ConvexParsedVersion {
  license?: string;
  clawdis?: {
    emoji?: string;
    os?: string[];
    nix?: { plugin?: boolean; systems?: string[] };
  };
}

export interface ConvexDetailVersion {
  _id: string;
  _creationTime: number;
  version: string;
  changelog?: string;
  changelogSource?: string;
  createdAt: number;
  createdBy?: string;
  fingerprint?: string;
  sha256hash?: string;
  files: ConvexFileEntry[];
  parsed?: ConvexParsedVersion;
  vtAnalysis?: ConvexVtAnalysis;
  llmAnalysis?: ConvexLlmAnalysis;
}

export interface ConvexModerationInfo {
  isPendingScan?: boolean;
  isMalwareBlocked?: boolean;
  isSuspicious?: boolean;
  isHiddenByMod?: boolean;
  isRemoved?: boolean;
  verdict?: string;
  reasonCodes?: string[];
  summary?: string;
}

export interface ConvexForkOf {
  skillId: string;
  kind: string;
  version?: string;
  at?: number;
}

export interface ConvexDetailOwner {
  _id: string;
  handle?: string;
  displayName?: string;
  image?: string;
}

export interface ConvexGetBySlugResult {
  skill: ConvexListPageSkill | null;
  latestVersion: ConvexDetailVersion | null;
  owner: ConvexDetailOwner | null;
  moderationInfo: ConvexModerationInfo | null;
  forkOf: ConvexForkOf | null;
  canonical: unknown;
  resolvedSlug?: string;
  requestedSlug?: string;
  pendingReview?: boolean;
}

export interface ConvexSearchResultEntry {
  score: number;
  slug?: string;
  displayName?: string;
  summary?: string | null;
  version?: string | null;
  updatedAt?: number;
}

export interface ConvexSearchResponse {
  results: ConvexSearchResultEntry[];
}

export interface ConvexCommentUser {
  _id: string;
  _creationTime: number;
  handle: string;
  displayName: string;
  image: string;
  name?: string;
}

export interface ConvexComment {
  _id: string;
  _creationTime: number;
  skillId: string;
  userId: string;
  body: string;
  createdAt: number;
  reportCount?: number;
  lastReportedAt?: number;
  softDeletedAt?: number;
}

export interface ConvexCommentListItem {
  comment: ConvexComment;
  user: ConvexCommentUser;
}
