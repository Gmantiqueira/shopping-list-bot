interface PendingConfirmation {
  groupId: string;
  userId: string;
  command: 'CLEAR';
  expiresAt: Date;
}

export class ConfirmationManager {
  private pendingConfirmations: Map<string, PendingConfirmation> = new Map();
  private readonly timeoutMs = 30000; // 30 segundos

  requestClear(groupId: string, userId: string): void {
    const key = this.getKey(groupId, userId);
    const expiresAt = new Date(Date.now() + this.timeoutMs);

    this.pendingConfirmations.set(key, {
      groupId,
      userId,
      command: 'CLEAR',
      expiresAt,
    });

    // Limpa confirmações expiradas periodicamente
    this.cleanupExpired();
  }

  checkAndConsume(
    groupId: string,
    userId: string,
    text: string
  ): 'CLEAR' | null {
    const key = this.getKey(groupId, userId);
    const confirmation = this.pendingConfirmations.get(key);

    if (!confirmation) {
      return null;
    }

    // Verifica se expirou
    if (new Date() > confirmation.expiresAt) {
      this.pendingConfirmations.delete(key);
      return null;
    }

    // Verifica se é confirmação
    if (text.trim().toUpperCase() === 'SIM') {
      this.pendingConfirmations.delete(key);
      return confirmation.command;
    }

    return null;
  }

  hasPending(groupId: string, userId: string): boolean {
    const key = this.getKey(groupId, userId);
    const confirmation = this.pendingConfirmations.get(key);

    if (!confirmation) {
      return false;
    }

    // Verifica se expirou
    if (new Date() > confirmation.expiresAt) {
      this.pendingConfirmations.delete(key);
      return false;
    }

    return true;
  }

  private getKey(groupId: string, userId: string): string {
    return `${groupId}:${userId}`;
  }

  private cleanupExpired(): void {
    const now = new Date();
    for (const [key, confirmation] of this.pendingConfirmations.entries()) {
      if (now > confirmation.expiresAt) {
        this.pendingConfirmations.delete(key);
      }
    }
  }
}
