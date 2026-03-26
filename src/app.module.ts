import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { appConfig } from './config/config';
import { SkillModule } from './skill/skill.module';
import { ConvexClientModule } from './convex-client/convex-client.module';
import { SyncModule } from './sync/sync.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('app.mongodbUri'),
      }),
    }),
    ScheduleModule.forRoot(),
    HttpModule,
    ConvexClientModule,
    SkillModule,
    SyncModule,
    HealthModule,
  ],
})
export class AppModule {}
