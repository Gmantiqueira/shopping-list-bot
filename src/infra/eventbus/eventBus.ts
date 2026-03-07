export interface SimulatorMessage {
  id: string;
  groupId: string;
  from: 'user' | 'bot';
  userId?: string;
  text: string;
  createdAt: string;
}

type MessageHandler = (message: SimulatorMessage) => void;

export class EventBus {
  private subscribers: Map<string, Set<MessageHandler>> = new Map();
  private history: Map<string, SimulatorMessage[]> = new Map();
  private readonly maxHistorySize = 200;

  publish(groupId: string, message: SimulatorMessage): void {
    // Adiciona ao histórico
    if (!this.history.has(groupId)) {
      this.history.set(groupId, []);
    }

    const groupHistory = this.history.get(groupId)!;
    groupHistory.push(message);

    // Mantém apenas últimas 200 mensagens (ring buffer)
    if (groupHistory.length > this.maxHistorySize) {
      groupHistory.shift();
    }

    // Notifica subscribers
    const handlers = this.subscribers.get(groupId);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  subscribe(groupId: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(groupId)) {
      this.subscribers.set(groupId, new Set());
    }

    const handlers = this.subscribers.get(groupId)!;
    handlers.add(handler);

    // Retorna função de unsubscribe
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(groupId);
      }
    };
  }

  getHistory(groupId: string): SimulatorMessage[] {
    return this.history.get(groupId) || [];
  }

  clearHistory(groupId: string): void {
    this.history.delete(groupId);
  }
}

// Singleton global
export const eventBus = new EventBus();
