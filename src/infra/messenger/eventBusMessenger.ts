import type { Messenger } from './messenger.js';
import { eventBus } from '../eventbus/eventBus.js';

export class EventBusMessenger implements Messenger {
  constructor(private readonly baseMessenger: Messenger) {}

  async sendMessage(groupId: string, message: string): Promise<void> {
    // Envia via messenger base (console ou WhatsApp)
    await this.baseMessenger.sendMessage(groupId, message);

    // Publica no EventBus
    eventBus.publish(groupId, {
      id: crypto.randomUUID(),
      groupId,
      from: 'bot',
      text: message,
      createdAt: new Date().toISOString(),
    });
  }
}
