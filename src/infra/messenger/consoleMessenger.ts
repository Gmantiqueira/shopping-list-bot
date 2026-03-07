import type { Messenger } from './messenger.js';

export class ConsoleMessenger implements Messenger {
  async sendMessage(groupId: string, message: string): Promise<void> {
    console.log(`[${groupId}][bot] ${message}`);
  }
}
