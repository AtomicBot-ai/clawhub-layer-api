import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SkillService } from './skill.service';
import {
  ListSkillsQuery,
  SearchSkillsQuery,
  GetFileQuery,
  ListCommentsQuery,
  SkillListResponseDto,
  SkillDetailResponseDto,
  SearchResultItemDto,
  CommentDto,
} from './skill.types';

@ApiTags('skills')
@Controller('api/skills')
export class SkillController {
  constructor(private readonly service: SkillService) {}

  @Get()
  @ApiOperation({ summary: 'List skills', description: 'Paginated list of skills with sorting, filtering and full-text search. Pass "q" to search by slug, displayName and summary.' })
  @ApiResponse({ status: 200, description: 'Paginated skill list', type: SkillListResponseDto })
  list(@Query() query: ListSkillsQuery) {
    return this.service.list({
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      sort: query.sort ?? (query.q ? 'relevance' : 'downloads'),
      dir: query.dir ?? 'desc',
      q: query.q,
      nonSuspiciousOnly: query.nonSuspiciousOnly,
    });
  }

  /** @deprecated Use GET /api/skills?q=... instead */
  @Get('search')
  @ApiOperation({
    summary: 'Search skills (deprecated)',
    description: 'Deprecated: use GET /api/skills?q=... instead. Full-text search across slug, displayName and summary.',
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: 'Search results', type: [SearchResultItemDto] })
  search(@Query() query: SearchSkillsQuery) {
    return this.service.search(query.q, query.limit ?? 25);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get skill by slug', description: 'Returns cached skill data and triggers background refresh from ClawHub. Includes security scans, files, moderation info.' })
  @ApiParam({ name: 'slug', description: 'Skill slug identifier', example: 'summarize' })
  @ApiResponse({ status: 200, description: 'Skill detail', type: SkillDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  getBySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }

  @Get(':slug/comments')
  @ApiOperation({ summary: 'Get skill comments', description: 'Fetches comments from ClawHub in real-time. Returns user info and comment body.' })
  @ApiParam({ name: 'slug', description: 'Skill slug identifier', example: 'summarize' })
  @ApiResponse({ status: 200, description: 'List of comments', type: [CommentDto] })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  getComments(@Param('slug') slug: string, @Query() query: ListCommentsQuery) {
    return this.service.getComments(slug, query.limit);
  }

  @Get(':slug/files')
  @ApiOperation({ summary: 'Get skill file content', description: 'Returns file content (e.g. SKILL.md). Cached with stale-while-revalidate.' })
  @ApiParam({ name: 'slug', description: 'Skill slug identifier', example: 'summarize' })
  @ApiResponse({ status: 200, description: 'File content as plain text', type: String })
  @ApiResponse({ status: 404, description: 'Skill or file not found' })
  getFile(@Param('slug') slug: string, @Query() query: GetFileQuery) {
    return this.service.getFileContent(slug, query.path);
  }
}
