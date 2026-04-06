import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConvexClientService } from '../convex-client/convex-client.service';
import { SkillRepository, BulkUpsertItem } from '../skill/skill.repository';
import { ConvexListPageItem } from '../convex-client/convex-client.types';

const PAGE_SIZE = 200;

@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name);
  private syncing = false;
  private intervalRef: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly convex: ConvexClientService,
    private readonly repo: SkillRepository,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMinutes = this.config.get<number>('app.syncIntervalMinutes', 90);
    const intervalMs = intervalMinutes * 60 * 1000;

    this.intervalRef = setInterval(() => {
      this.runFullSync().catch((err) =>
        this.logger.error(`Scheduled sync failed: ${err}`),
      );
    }, intervalMs);

    this.logger.log(`Scheduled skills sync every ${intervalMinutes} minutes`);
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  isSyncing(): boolean {
    return this.syncing;
  }

  async runFullSync(): Promise<{ totalSynced: number; pages: number; removed: number }> {
    if (this.syncing) {
      this.logger.warn('Sync already in progress, skipping');
      return { totalSynced: 0, pages: 0, removed: 0 };
    }

    this.syncing = true;
    const startTime = Date.now();
    let totalSynced = 0;
    let pages = 0;
    let cursor: string | undefined;
    const allSlugs: string[] = [];

    try {
      this.logger.log('Starting full skills sync...');

      do {
        const result = await this.convex.listPublicPage({
          numItems: PAGE_SIZE,
          sort: 'newest',
          dir: 'desc',
          cursor,
          nonSuspiciousOnly: false,
        });

        const items = result.page.map(mapPageItemToUpsert);
        const synced = await this.repo.bulkUpsert(items);

        for (const item of result.page) {
          allSlugs.push(item.skill.slug);
        }

        totalSynced += synced;
        pages++;
        cursor = result.nextCursor ?? undefined;

        const slugs = result.page
          .slice(0, 5)
          .map((p) => p.skill.slug)
          .join(', ');
        const sample = result.page.length > 5 ? `${slugs}, ...` : slugs;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        this.logger.log(
          `[page ${pages}] ${synced} skills synced (${totalSynced} total, ${elapsed}s) | ${sample}`,
        );
      } while (cursor);

      const removed = await this.repo.markRemovedExcept(allSlugs);
      const restored = await this.repo.unmarkRemoved(allSlugs);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `Sync complete: ${totalSynced} synced, ${removed} marked removed, ${restored} restored across ${pages} pages in ${elapsed}s`,
      );

      return { totalSynced, pages, removed };
    } catch (err) {
      this.logger.error(`Sync failed after ${pages} pages: ${err}`);
      throw err;
    } finally {
      this.syncing = false;
    }
  }
}

function mapPageItemToUpsert(item: ConvexListPageItem): BulkUpsertItem {
  const skill = item.skill;
  const version = item.latestVersion;
  const owner = item.owner;

  const badges = {
    highlighted: Boolean(skill.badges?.highlighted),
    official: Boolean(skill.badges?.official),
    deprecated: Boolean(skill.badges?.deprecated),
  };

  return {
    slug: skill.slug,
    data: {
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
            kind: owner.kind ?? 'user',
          }
        : null,
      syncedAt: new Date(),
    },
  };
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
