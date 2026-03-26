import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConvexClientService } from './convex-client.service';

@Module({
  imports: [HttpModule],
  providers: [ConvexClientService],
  exports: [ConvexClientService],
})
export class ConvexClientModule {}
