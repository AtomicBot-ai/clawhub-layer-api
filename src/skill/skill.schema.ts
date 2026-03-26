import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SkillDocument = HydratedDocument<Skill>;

@Schema({ _id: true, timestamps: false, collection: 'skills' })
export class Skill {
  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ type: String, default: null })
  summary!: string | null;

  @Prop({ type: String, default: null })
  emoji!: string | null;

  @Prop({ required: true })
  sourceId!: string;

  @Prop(
    raw({
      highlighted: { type: Boolean, default: false },
      official: { type: Boolean, default: false },
      deprecated: { type: Boolean, default: false },
    }),
  )
  badges!: { highlighted: boolean; official: boolean; deprecated: boolean };

  @Prop(
    raw({
      downloads: { type: Number, default: 0 },
      installsCurrent: { type: Number, default: 0 },
      installsAllTime: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
      versions: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    }),
  )
  stats!: {
    downloads: number;
    installsCurrent: number;
    installsAllTime: number;
    stars: number;
    versions: number;
    comments: number;
  };

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  tags!: Record<string, string>;

  @Prop({ required: true })
  createdAt!: number;

  @Prop({ required: true })
  updatedAt!: number;

  @Prop(
    raw({
      version: { type: String },
      createdAt: { type: Number },
      changelog: { type: String, default: '' },
      changelogSource: { type: String, default: null },
    }),
  )
  latestVersion!: {
    version: string;
    createdAt: number;
    changelog: string;
    changelogSource: string | null;
  } | null;

  @Prop(
    raw({
      handle: { type: String },
      displayName: { type: String },
      image: { type: String },
      kind: { type: String },
    }),
  )
  owner!: {
    handle: string;
    displayName: string;
    image: string;
    kind: string;
  } | null;

  @Prop({ type: String, default: null })
  license!: string | null;

  @Prop({ type: [String], default: null })
  platforms!: string[] | null;

  @Prop({
    type: [
      raw({
        path: { type: String },
        size: { type: Number },
        sha256: { type: String },
        contentType: { type: String, default: null },
      }),
    ],
    default: null,
  })
  files!: Array<{
    path: string;
    size: number;
    sha256: string;
    contentType: string | null;
  }> | null;

  @Prop(
    raw({
      status: { type: String },
      verdict: { type: String },
      analysis: { type: String, default: null },
      source: { type: String, default: null },
      checkedAt: { type: Number },
    }),
  )
  vtAnalysis!: {
    status: string;
    verdict: string;
    analysis: string | null;
    source: string | null;
    checkedAt: number;
  } | null;

  @Prop(
    raw({
      status: { type: String },
      verdict: { type: String },
      confidence: { type: String },
      summary: { type: String, default: null },
      guidance: { type: String, default: null },
      model: { type: String },
      checkedAt: { type: Number },
      dimensions: {
        type: [
          raw({
            name: { type: String },
            label: { type: String },
            rating: { type: String },
            detail: { type: String },
          }),
        ],
        default: null,
      },
    }),
  )
  llmAnalysis!: {
    status: string;
    verdict: string;
    confidence: string;
    summary: string | null;
    guidance: string | null;
    model: string;
    checkedAt: number;
    dimensions: Array<{
      name: string;
      label: string;
      rating: string;
      detail: string;
    }> | null;
  } | null;

  @Prop(
    raw({
      isPendingScan: { type: Boolean, default: false },
      isMalwareBlocked: { type: Boolean, default: false },
      isSuspicious: { type: Boolean, default: false },
      isHiddenByMod: { type: Boolean, default: false },
      isRemoved: { type: Boolean, default: false },
      verdict: { type: String, default: null },
      reasonCodes: { type: [String], default: [] },
      summary: { type: String, default: null },
    }),
  )
  moderation!: {
    isPendingScan: boolean;
    isMalwareBlocked: boolean;
    isSuspicious: boolean;
    isHiddenByMod: boolean;
    isRemoved: boolean;
    verdict: string | null;
    reasonCodes: string[];
    summary: string | null;
  } | null;

  @Prop(
    raw({
      skillId: { type: String },
      kind: { type: String },
      version: { type: String, default: null },
      at: { type: Number, default: null },
    }),
  )
  forkOf!: {
    skillId: string;
    kind: string;
    version: string | null;
    at: number | null;
  } | null;

  @Prop({ type: String, default: null })
  canonicalSkillId!: string | null;

  @Prop({ type: String, default: null })
  skillMd!: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  fileContents!: Record<
    string,
    { content: string; cachedAt: Date }
  > | null;

  @Prop({ required: true })
  syncedAt!: Date;

  @Prop({ type: Date, default: null })
  detailSyncedAt!: Date | null;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);

SkillSchema.index({ 'stats.downloads': -1 });
SkillSchema.index({ 'stats.stars': -1 });
SkillSchema.index({ 'stats.installsCurrent': -1 });
SkillSchema.index({ updatedAt: -1 });
SkillSchema.index({ createdAt: -1 });
SkillSchema.index({ displayName: 1 });
SkillSchema.index(
  { slug: 'text', displayName: 'text', summary: 'text' },
  { weights: { slug: 10, displayName: 5, summary: 1 } },
);
