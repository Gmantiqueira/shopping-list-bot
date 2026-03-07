import { WhatsAppSender } from './whatsappSender.js';
import { ConsoleMessenger } from './consoleMessenger.js';
import { EventBusMessenger } from './eventBusMessenger.js';
import type { Messenger } from './messenger.js';

export function createMessenger(): Messenger {
  const whatsappSender = new WhatsAppSender();

  let baseMessenger: Messenger;
  if (whatsappSender.isEnabled()) {
    baseMessenger = whatsappSender;
  } else {
    baseMessenger = new ConsoleMessenger();
  }

  // Sempre envolve com EventBusMessenger para publicar eventos
  return new EventBusMessenger(baseMessenger);
}
