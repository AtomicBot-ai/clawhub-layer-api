import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkillRepository } from './skill.repository';
import { ConvexClientService } from '../convex-client/convex-client.service';
import { Skill, SkillDocument } from './skill.schema';
import {
  SkillListResponse,
  SkillListItem,
  SkillDetailResponse,
  SearchResultItem,
  CommentDto,
} from './skill.types';
import { ConvexGetBySlugResult } from '../convex-client/convex-client.types';

@Injectable()
export class SkillService {
  private readonly logger = new Logger(SkillService.name);
  private readonly cacheTtlMs: number;

  constructor(
    private readonly repo: SkillRepository,
    private readonly convex: ConvexClientService,
    private readonly config: ConfigService,
  ) {
    this.cacheTtlMs = this.config.get<number>('app.cacheTtlMs')!;
  }

  async list(options: {
    page: number;
    limit: number;
    sort: string;
    dir: string;
    nonSuspiciousOnly?: boolean;
  }): Promise<SkillListResponse> {
    const { items, total } = await this.repo.findPaginated(options);

    return {
      items: items.map(toListItem),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async search(query: string, limit: number): Promise<SearchResultItem[]> {
    const localResults = await this.repo.textSearch(query, limit);

    return localResults.map((doc) => ({
      score: (doc as unknown as { _doc?: { score?: number } })._doc?.score ?? 0,
      slug: doc.slug,
      displayName: doc.displayName,
      summary: doc.summary,
      version: doc.latestVersion?.version ?? null,
      updatedAt: doc.updatedAt,
    }));
  }

  async getBySlug(slug: string): Promise<SkillDetailResponse> {
    const cached = await this.repo.findBySlug(slug);

    if (cached?.detailSyncedAt && !this.isStale(cached.detailSyncedAt)) {
      this.logger.debug(`Cache hit for detail "${slug}"`);
      return toDetailResponse(cached);
    }

    this.logger.log(`Cache miss/stale for detail "${slug}", fetching from Convex`);
    const fresh = await this.fetchAndSaveDetail(slug);
    if (!fresh) {
      if (cached) return toDetailResponse(cached);
      throw new NotFoundException(`Skill "${slug}" not found`);
    }
    return toDetailResponse(fresh);
  }

  async getFileContent(slug: string, filePath: string): Promise<string> {
    const skill = await this.repo.findBySlug(slug);
    if (!skill) {
      throw new NotFoundException(`Skill "${slug}" not found`);
    }

    const safeKey = filePath.replace(/\./g, '\u2024');
    const cached = skill.fileContents?.[safeKey];
    if (cached && !this.isStale(cached.cachedAt)) {
      this.logger.debug(`Cache hit for file "${slug}/${filePath}"`);
      return cached.content;
    }

    this.logger.log(`Cache miss/stale for file "${slug}/${filePath}", fetching from Convex`);
    const content = await this.convex.getFileContent(slug, filePath);
    if (content === null) {
      if (cached) return cached.content;
      throw new NotFoundException(
        `File "${filePath}" not found for skill "${slug}"`,
      );
    }

    await this.repo.updateFileContent(slug, filePath, content);
    return content;
  }

  async getComments(slug: string, limit?: number): Promise<CommentDto[]> {
    const skill = await this.repo.findBySlug(slug);
    if (!skill) {
      throw new NotFoundException(`Skill "${slug}" not found`);
    }

    this.logger.log(`Fetching comments for "${slug}" from Convex`);
    const items = await this.convex.listCommentsBySkillId(
      skill.sourceId,
      limit,
    );

    return items.map((item) => ({
      id: item.comment._id,
      user: {
        handle: item.user.handle ?? '',
        displayName: item.user.displayName ?? '',
        image: item.user.image ?? '',
      },
      body: item.comment.body,
      createdAt: item.comment.createdAt,
    }));
  }

  private isStale(date: Date): boolean {
    return Date.now() - date.getTime() > this.cacheTtlMs;
  }

  private async fetchAndSaveDetail(
    slug: string,
  ): Promise<SkillDocument | null> {
    this.logger.log(`Fetching detail for "${slug}" from Convex`);
    const result = await this.convex.getBySlug(slug);
    if (!result?.skill) return null;

    const data = mapDetailToSkillData(result);

    const hasSkillMd = result.latestVersion?.files?.some(
      (f) => f.path === 'SKILL.md',
    );
    if (hasSkillMd) {
      try {
        this.logger.log(`Fetching SKILL.md for "${slug}" from Convex`);
        const md = await this.convex.getFileContent(slug, 'SKILL.md');
        data.skillMd = md;
      } catch (err) {
        this.logger.warn(`Failed to fetch SKILL.md for ${slug}: ${err}`);
      }
    } else {
      data.skillMd = null;
    }

    return this.repo.upsertBySlug(slug, data);
  }
}

function mapDetailToSkillData(result: ConvexGetBySlugResult): Partial<Skill> {
  const skill = result.skill!;
  const version = result.latestVersion;
  const owner = result.owner;

  const badges = {
    highlighted: Boolean(skill.badges?.highlighted),
    official: Boolean(skill.badges?.official),
    deprecated: Boolean(skill.badges?.deprecated),
  };

  const data: Partial<Skill> = {
    slug: skill.slug,
    displayName: skill.displayName,
    summary: skill.summary ?? null,
    emoji: version?.parsed?.clawdis?.emoji ?? null,
    sourceId: skill._id,
    badges,
    stats: {
      downloads: skill.stats.downloads ?? 0,
      installsCurrent: skill.stats.installsCurrent ?? 0,
      installsAllTime: skill.stats.installsAllTime ?? 0,
      stars: skill.stats.stars ?? 0,
      versions: skill.stats.versions ?? 0,
      comments: skill.stats.comments ?? 0,
    },
    tags: normalizeTagsToVersionStrings(skill.tags),
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
    latestVersion: version
      ? {
          version: version.version,
          createdAt: version.createdAt,
          changelog: version.changelog ?? '',
          changelogSource: version.changelogSource ?? null,
        }
      : null,
    owner: owner
      ? {
          handle: owner.handle ?? '',
          displayName: owner.displayName ?? '',
          image: owner.image ?? '',
          kind: 'user',
        }
      : null,
    license: version?.parsed?.license ?? null,
    platforms: version?.parsed?.clawdis?.os ?? null,
    files: version?.files?.map((f) => ({
      path: f.path,
      size: f.size,
      sha256: f.sha256,
      contentType: f.contentType ?? null,
    })) ?? null,
    vtAnalysis: version?.vtAnalysis
      ? {
          status: version.vtAnalysis.status,
          verdict: version.vtAnalysis.verdict ?? '',
          analysis: version.vtAnalysis.analysis ?? null,
          source: version.vtAnalysis.source ?? null,
          checkedAt: version.vtAnalysis.checkedAt ?? 0,
        }
      : null,
    llmAnalysis: version?.llmAnalysis
      ? {
          status: version.llmAnalysis.status,
          verdict: version.llmAnalysis.verdict ?? '',
          confidence: version.llmAnalysis.confidence ?? '',
          summary: version.llmAnalysis.summary ?? null,
          guidance: version.llmAnalysis.guidance ?? null,
          model: version.llmAnalysis.model ?? '',
          checkedAt: version.llmAnalysis.checkedAt ?? 0,
          dimensions: version.llmAnalysis.dimensions ?? null,
        }
      : null,
    moderation: result.moderationInfo
      ? {
          isPendingScan: result.moderationInfo.isPendingScan ?? false,
          isMalwareBlocked: result.moderationInfo.isMalwareBlocked ?? false,
          isSuspicious: result.moderationInfo.isSuspicious ?? false,
          isHiddenByMod: result.moderationInfo.isHiddenByMod ?? false,
          isRemoved: result.moderationInfo.isRemoved ?? false,
          verdict: result.moderationInfo.verdict ?? null,
          reasonCodes: result.moderationInfo.reasonCodes ?? [],
          summary: result.moderationInfo.summary ?? null,
        }
      : null,
    forkOf: result.forkOf
      ? {
          skillId: result.forkOf.skillId,
          kind: result.forkOf.kind,
          version: result.forkOf.version ?? null,
          at: result.forkOf.at ?? null,
        }
      : null,
    canonicalSkillId: null,
    detailSyncedAt: new Date(),
    syncedAt: new Date(),
  };

  return data;
}

function normalizeTagsToVersionStrings(
  tags: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    result[key] = typeof value === 'string' ? value : String(value);
  }
  return result;
}

function toListItem(doc: SkillDocument): SkillListItem {
  return {
    slug: doc.slug,
    displayName: doc.displayName,
    summary: doc.summary,
    emoji: doc.emoji ?? null,
    badges: doc.badges,
    stats: doc.stats,
    tags: doc.tags,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    latestVersion: doc.latestVersion,
    owner: doc.owner,
  };
}

function toDetailResponse(doc: SkillDocument): SkillDetailResponse {
  return {
    ...toListItem(doc),
    sourceId: doc.sourceId,
    license: doc.license,
    platforms: doc.platforms,
    files: doc.files,
    vtAnalysis: doc.vtAnalysis,
    llmAnalysis: doc.llmAnalysis,
    moderation: doc.moderation,
    forkOf: doc.forkOf,
    canonicalSkillId: doc.canonicalSkillId,
    skillMd: doc.skillMd ?? null,
    syncedAt: doc.syncedAt?.toISOString() ?? new Date().toISOString(),
    detailSyncedAt: doc.detailSyncedAt?.toISOString() ?? null,
  };
}
