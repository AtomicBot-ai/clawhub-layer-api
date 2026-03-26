import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ConvexQueryResponse,
  ConvexListPageResult,
  ConvexGetBySlugResult,
  ConvexSearchResponse,
  ConvexCommentListItem,
} from './convex-client.types';

@Injectable()
export class ConvexClientService {
  private readonly logger = new Logger(ConvexClientService.name);
  private readonly cloudUrl: string;
  private readonly siteUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.cloudUrl = this.config.getOrThrow<string>('app.convexCloudUrl');
    this.siteUrl = this.config.getOrThrow<string>('app.convexSiteUrl');
  }

  async listPublicPage(args: {
    numItems?: number;
    sort?: string;
    dir?: string;
    cursor?: string;
    nonSuspiciousOnly?: boolean;
  }): Promise<ConvexListPageResult> {
    const response = await this.convexQuery<ConvexListPageResult>(
      'skills:listPublicPageV4',
      args,
    );
    return response;
  }

  async getBySlug(slug: string): Promise<ConvexGetBySlugResult | null> {
    const response = await this.convexQuery<ConvexGetBySlugResult | null>(
      'skills:getBySlug',
      { slug },
    );
    return response;
  }

  async searchSkills(
    query: string,
    limit?: number,
  ): Promise<ConvexSearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set('limit', String(limit));

    const url = `${this.siteUrl}/api/v1/search?${params}`;
    const { data } = await firstValueFrom(
      this.http.get<ConvexSearchResponse>(url),
    );
    return data;
  }

  async getFileContent(slug: string, path: string): Promise<string | null> {
    const params = new URLSearchParams({ path });
    const url = `${this.siteUrl}/api/v1/skills/${encodeURIComponent(slug)}/file?${params}`;

    try {
      const { data } = await firstValueFrom(
        this.http.get<string>(url, { responseType: 'text' }),
      );
      return data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404 || status === 410) return null;
      throw err;
    }
  }

  async listCommentsBySkillId(
    skillId: string,
    limit?: number,
  ): Promise<ConvexCommentListItem[]> {
    const args: Record<string, unknown> = { skillId };
    if (limit) args.limit = limit;

    return this.convexQuery<ConvexCommentListItem[]>(
      'comments:listBySkill',
      args,
    );
  }

  private async convexQuery<T>(path: string, args: unknown): Promise<T> {
    const url = `${this.cloudUrl}/api/query`;
    const { data } = await firstValueFrom(
      this.http.post<ConvexQueryResponse<T>>(url, { path, args }),
    );

    if (data.status !== 'success') {
      this.logger.error(
        `Convex query ${path} failed: ${data.errorMessage ?? 'unknown'}`,
      );
      throw new Error(`Convex query failed: ${data.errorMessage}`);
    }

    return data.value as T;
  }
}
