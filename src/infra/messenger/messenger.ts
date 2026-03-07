export interface Messenger {
  sendMessage(groupId: string, message: string): Promise<void>;
}
