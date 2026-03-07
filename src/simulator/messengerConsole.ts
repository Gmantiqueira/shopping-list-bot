export class MessengerConsole {
  printUserMessage(groupId: string, userId: string, message: string): void {
    console.log(`[${groupId}][${userId}] ${message}`);
  }

  printBotMessage(groupId: string, message: string): void {
    console.log(`[${groupId}][bot] ${message}`);
  }

  printError(groupId: string, error: string): void {
    console.error(`[${groupId}][bot] ❌ ${error}`);
  }

  printInfo(message: string): void {
    console.log(`ℹ️  ${message}`);
  }
}
