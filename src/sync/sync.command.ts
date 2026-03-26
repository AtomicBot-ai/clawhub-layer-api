import { Command, CommandRunner } from 'nest-commander';
import { SyncService } from './sync.service';

@Command({ name: 'sync', description: 'Run full skills sync from ClawHub' })
export class SyncCommand extends CommandRunner {
  constructor(private readonly syncService: SyncService) {
    super();
  }

  async run(): Promise<void> {
    const result = await this.syncService.runFullSync();
    console.log(
      `Sync completed: ${result.totalSynced} skills across ${result.pages} pages`,
    );
  }
}
