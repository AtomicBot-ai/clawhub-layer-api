import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns service and database status' })
  @ApiResponse({ status: 200, description: 'Service health', schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['ok', 'degraded'], example: 'ok' },
      timestamp: { type: 'string', format: 'date-time' },
      database: { type: 'string', enum: ['connected', 'disconnected'], example: 'connected' },
    },
  }})
  async check() {
    const dbState = this.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    return {
      status: dbState === 1 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
