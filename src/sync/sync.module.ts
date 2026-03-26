import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncCommand } from './sync.command';
import { ConvexClientModule } from '../convex-client/convex-client.module';
import { SkillModule } from '../skill/skill.module';

@Module({
  imports: [ConvexClientModule, SkillModule],
  providers: [SyncService, SyncCommand],
  exports: [SyncService],
})
export class SyncModule {}
