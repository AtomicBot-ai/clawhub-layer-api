import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Skill, SkillSchema } from './skill.schema';
import { SkillRepository } from './skill.repository';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';
import { ConvexClientModule } from '../convex-client/convex-client.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Skill.name, schema: SkillSchema }]),
    ConvexClientModule,
  ],
  controllers: [SkillController],
  providers: [SkillRepository, SkillService],
  exports: [SkillRepository, SkillService],
})
export class SkillModule {}
