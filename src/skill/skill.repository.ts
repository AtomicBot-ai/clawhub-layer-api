import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Skill, SkillDocument } from './skill.schema';

const SORT_FIELD_MAP: Record<string, string> = {
  downloads: 'stats.downloads',
  stars: 'stats.stars',
  installs: 'stats.installsCurrent',
  updated: 'updatedAt',
  newest: 'createdAt',
  name: 'displayName',
};

export interface BulkUpsertItem {
  slug: string;
  data: Partial<Skill>;
}

@Injectable()
export class SkillRepository {
  constructor(
    @InjectModel(Skill.name)
    private readonly model: Model<SkillDocument>,
  ) {}

  async findBySlug(slug: string): Promise<SkillDocument | null> {
    return this.model.findOne({ slug }).exec();
  }

  async findPaginated(options: {
    page: number;
    limit: number;
    sort: string;
    dir: string;
    q?: string;
    nonSuspiciousOnly?: boolean;
  }): Promise<{ items: SkillDocument[]; total: number }> {
    const filter: Record<string, unknown> = {};

    if (options.q) {
      filter.$text = { $search: options.q };
    }

    if (options.nonSuspiciousOnly) {
      filter.$or = [
        { moderation: null },
        { 'moderation.isSuspicious': false, 'moderation.isMalwareBlocked': false },
      ];
    }

    const projection = options.q ? { score: { $meta: 'textScore' } } : {};

    const sortSpec =
      options.sort === 'relevance' && options.q
        ? { score: { $meta: 'textScore' } as unknown as SortOrder }
        : { [SORT_FIELD_MAP[options.sort] ?? 'stats.downloads']: (options.dir === 'asc' ? 1 : -1) as SortOrder };

    const skip = (options.page - 1) * options.limit;

    const [items, total] = await Promise.all([
      this.model
        .find(filter, projection)
        .sort(sortSpec)
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async textSearch(
    query: string,
    limit: number,
  ): Promise<SkillDocument[]> {
    return this.model
      .find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .exec();
  }

  async upsertBySlug(
    slug: string,
    data: Partial<Skill>,
  ): Promise<SkillDocument> {
    return this.model
      .findOneAndUpdate({ slug }, { $set: data }, { upsert: true, new: true })
      .exec() as Promise<SkillDocument>;
  }

  async bulkUpsert(items: BulkUpsertItem[]): Promise<number> {
    if (items.length === 0) return 0;

    const ops = items.map((item) => ({
      updateOne: {
        filter: { slug: item.slug },
        update: { $set: item.data },
        upsert: true,
      },
    }));

    const result = await this.model.bulkWrite(ops, { ordered: false });
    return result.upsertedCount + result.modifiedCount;
  }

  async count(): Promise<number> {
    return this.model.estimatedDocumentCount().exec();
  }

  async updateFileContent(
    slug: string,
    filePath: string,
    content: string,
  ): Promise<void> {
    const safeKey = filePath.replace(/\./g, '\u2024');
    const entry = { content, cachedAt: new Date() };

    const result = await this.model.updateOne(
      { slug, fileContents: { $ne: null } },
      { $set: { [`fileContents.${safeKey}`]: entry } },
    );

    if (result.matchedCount === 0) {
      await this.model.updateOne(
        { slug },
        { $set: { fileContents: { [safeKey]: entry } } },
      );
    }
  }
}
