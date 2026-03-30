import { IsOptional, IsString, IsInt, Min, Max, IsIn, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Query DTOs ──

export class ListSkillsQuery {
  @ApiPropertyOptional({ description: 'Full-text search query. When provided, results are sorted by relevance by default.' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 25, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 25;

  @ApiPropertyOptional({
    description: 'Sort field. "relevance" is only available when q is provided.',
    default: 'downloads',
    enum: ['downloads', 'stars', 'installs', 'updated', 'newest', 'name', 'relevance'],
  })
  @IsOptional()
  @IsIn(['downloads', 'stars', 'installs', 'updated', 'newest', 'name', 'relevance'])
  sort?: string;

  @ApiPropertyOptional({ description: 'Sort direction', default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  dir?: string = 'desc';

  @ApiPropertyOptional({ description: 'Exclude suspicious/malicious skills', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  nonSuspiciousOnly?: boolean;
}

export class SearchSkillsQuery {
  @ApiProperty({ description: 'Search query text' })
  @IsString()
  q!: string;

  @ApiPropertyOptional({ description: 'Max results', default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}

export class GetFileQuery {
  @ApiProperty({ description: 'File path within the skill', example: 'SKILL.md' })
  @IsString()
  path!: string;
}

// ── Response DTOs ──

export class SkillBadgesDto {
  @ApiProperty({ description: 'Highlighted / featured skill' })
  highlighted!: boolean;

  @ApiProperty({ description: 'Official skill' })
  official!: boolean;

  @ApiProperty({ description: 'Deprecated skill' })
  deprecated!: boolean;
}

export class SkillStatsDto {
  @ApiProperty() downloads!: number;
  @ApiProperty() installsCurrent!: number;
  @ApiProperty() installsAllTime!: number;
  @ApiProperty() stars!: number;
  @ApiProperty() versions!: number;
  @ApiProperty() comments!: number;
}

export class SkillVersionDto {
  @ApiProperty({ example: '1.0.2' }) version!: string;
  @ApiProperty({ description: 'Unix ms timestamp' }) createdAt!: number;
  @ApiProperty() changelog!: string;
  @ApiPropertyOptional({ enum: ['auto', 'user'] }) changelogSource!: string | null;
}

export class SkillOwnerDto {
  @ApiProperty({ example: 'steipete' }) handle!: string;
  @ApiProperty({ example: 'Peter Steinberger' }) displayName!: string;
  @ApiProperty({ description: 'Avatar URL' }) image!: string;
  @ApiProperty({ enum: ['user', 'org'] }) kind!: string;
}

export class SkillListItemDto {
  @ApiProperty({ example: 'summarize' }) slug!: string;
  @ApiProperty({ example: 'Summarize' }) displayName!: string;
  @ApiPropertyOptional() summary!: string | null;
  @ApiPropertyOptional({ description: 'Skill emoji icon from metadata', example: '🧾' })
  emoji!: string | null;
  @ApiProperty({ type: SkillBadgesDto }) badges!: SkillBadgesDto;
  @ApiProperty({ type: SkillStatsDto }) stats!: SkillStatsDto;
  @ApiProperty({ description: 'Version tags, e.g. { latest: "1.0.0" }', example: { latest: '1.0.0' } })
  tags!: Record<string, string>;
  @ApiProperty({ description: 'Unix ms' }) createdAt!: number;
  @ApiProperty({ description: 'Unix ms' }) updatedAt!: number;
  @ApiPropertyOptional({ type: SkillVersionDto }) latestVersion!: SkillVersionDto | null;
  @ApiPropertyOptional({ type: SkillOwnerDto }) owner!: SkillOwnerDto | null;
}

export class SkillListResponseDto {
  @ApiProperty({ type: [SkillListItemDto] }) items!: SkillListItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}

export class SkillFileEntryDto {
  @ApiProperty({ example: 'SKILL.md' }) path!: string;
  @ApiProperty({ example: 7910 }) size!: number;
  @ApiProperty() sha256!: string;
  @ApiPropertyOptional({ example: 'text/markdown' }) contentType!: string | null;
}

export class VtAnalysisDto {
  @ApiProperty({ example: 'clean' }) status!: string;
  @ApiProperty({ enum: ['benign', 'suspicious', 'malicious'] }) verdict!: string;
  @ApiPropertyOptional() analysis!: string | null;
  @ApiPropertyOptional() source!: string | null;
  @ApiProperty({ description: 'Unix ms' }) checkedAt!: number;
}

export class LlmDimensionDto {
  @ApiProperty({ example: 'purpose_capability' }) name!: string;
  @ApiProperty({ example: 'Purpose & Capability' }) label!: string;
  @ApiProperty({ enum: ['ok', 'note', 'warn'] }) rating!: string;
  @ApiProperty() detail!: string;
}

export class LlmAnalysisDto {
  @ApiProperty({ example: 'clean' }) status!: string;
  @ApiProperty({ enum: ['benign', 'suspicious', 'malicious'] }) verdict!: string;
  @ApiProperty({ enum: ['high', 'medium', 'low'] }) confidence!: string;
  @ApiPropertyOptional() summary!: string | null;
  @ApiPropertyOptional() guidance!: string | null;
  @ApiProperty({ example: 'gpt-5-mini' }) model!: string;
  @ApiProperty({ description: 'Unix ms' }) checkedAt!: number;
  @ApiPropertyOptional({ type: [LlmDimensionDto] }) dimensions!: LlmDimensionDto[] | null;
}

export class ModerationDto {
  @ApiProperty() isPendingScan!: boolean;
  @ApiProperty() isMalwareBlocked!: boolean;
  @ApiProperty() isSuspicious!: boolean;
  @ApiProperty() isHiddenByMod!: boolean;
  @ApiProperty() isRemoved!: boolean;
  @ApiPropertyOptional({ enum: ['clean', 'suspicious', 'malicious'] }) verdict!: string | null;
  @ApiProperty({ type: [String] }) reasonCodes!: string[];
  @ApiPropertyOptional() summary!: string | null;
}

export class ForkOfDto {
  @ApiProperty() skillId!: string;
  @ApiProperty({ enum: ['fork', 'duplicate'] }) kind!: string;
  @ApiPropertyOptional() version!: string | null;
  @ApiPropertyOptional({ description: 'Unix ms' }) at!: number | null;
}

export class SkillDetailResponseDto extends SkillListItemDto {
  @ApiProperty() sourceId!: string;
  @ApiPropertyOptional({ example: 'MIT-0' }) license!: string | null;
  @ApiPropertyOptional({ type: [String], example: ['linux', 'darwin', 'win32'] })
  platforms!: string[] | null;
  @ApiPropertyOptional({ type: [SkillFileEntryDto] }) files!: SkillFileEntryDto[] | null;
  @ApiPropertyOptional({ type: VtAnalysisDto }) vtAnalysis!: VtAnalysisDto | null;
  @ApiPropertyOptional({ type: LlmAnalysisDto }) llmAnalysis!: LlmAnalysisDto | null;
  @ApiPropertyOptional({ type: ModerationDto }) moderation!: ModerationDto | null;
  @ApiPropertyOptional({ type: ForkOfDto }) forkOf!: ForkOfDto | null;
  @ApiPropertyOptional() canonicalSkillId!: string | null;
  @ApiPropertyOptional({ description: 'SKILL.md content, auto-fetched from ClawHub' })
  skillMd!: string | null;
  @ApiProperty({ description: 'ISO timestamp of last bulk sync' }) syncedAt!: string;
  @ApiPropertyOptional({ description: 'ISO timestamp of last detail enrichment' })
  detailSyncedAt!: string | null;
}

export class CommentUserDto {
  @ApiProperty({ example: 'steipete' }) handle!: string;
  @ApiProperty({ example: 'Peter Steinberger' }) displayName!: string;
  @ApiProperty({ description: 'Avatar URL' }) image!: string;
}

export class CommentDto {
  @ApiProperty({ description: 'Comment ID' }) id!: string;
  @ApiProperty({ type: CommentUserDto }) user!: CommentUserDto;
  @ApiProperty({ description: 'Comment body text' }) body!: string;
  @ApiProperty({ description: 'Unix ms timestamp' }) createdAt!: number;
}

export class ListCommentsQuery {
  @ApiPropertyOptional({ description: 'Max comments to return', default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

export class SearchResultItemDto {
  @ApiProperty() score!: number;
  @ApiProperty({ example: 'summarize' }) slug!: string;
  @ApiProperty({ example: 'Summarize' }) displayName!: string;
  @ApiPropertyOptional() summary!: string | null;
  @ApiPropertyOptional({ example: '1.0.0' }) version!: string | null;
  @ApiPropertyOptional({ description: 'Unix ms' }) updatedAt!: number | null;
}

// ── Service-level types (keep as interfaces for internal use) ──

export type SkillListResponse = SkillListResponseDto;
export type SkillListItem = SkillListItemDto;
export type SkillDetailResponse = SkillDetailResponseDto;
export type SearchResultItem = SearchResultItemDto;
