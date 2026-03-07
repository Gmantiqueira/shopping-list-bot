/**
 * Rastreia remoções recentes para detectar correções implícitas
 */
interface RemovalContext {
  groupId: string;
  userId: string;
  removedItem: string;
  removedAt: number; // timestamp
}

/**
 * Gerencia memória temporária de remoções para detectar correções implícitas
 */
export class ImplicitCorrectionTracker {
  private removals: Map<string, RemovalContext> = new Map();
  private readonly TTL_MS = 2 * 60 * 1000; // 2 minutos

  /**
   * Registra uma remoção de item
   */
  recordRemoval(groupId: string, userId: string, itemName: string): void {
    const key = this.getKey(groupId, userId);
    this.removals.set(key, {
      groupId,
      userId,
      removedItem: itemName,
      removedAt: Date.now(),
    });

    // Limpa remoções expiradas periodicamente
    this.cleanExpired();
  }

  /**
   * Verifica se há uma remoção recente e retorna o item removido
   */
  getRecentRemoval(
    groupId: string,
    userId: string
  ): { removedItem: string } | null {
    const key = this.getKey(groupId, userId);
    const context = this.removals.get(key);

    if (!context) {
      return null;
    }

    // Verifica se expirou
    const age = Date.now() - context.removedAt;
    if (age > this.TTL_MS) {
      this.removals.delete(key);
      return null;
    }

    return { removedItem: context.removedItem };
  }

  /**
   * Remove o contexto após processar correção
   */
  clearRemoval(groupId: string, userId: string): void {
    const key = this.getKey(groupId, userId);
    this.removals.delete(key);
  }

  /**
   * Gera chave única para (groupId, userId)
   */
  private getKey(groupId: string, userId: string): string {
    return `${groupId}:${userId}`;
  }

  /**
   * Limpa remoções expiradas
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, context] of this.removals.entries()) {
      if (now - context.removedAt > this.TTL_MS) {
        this.removals.delete(key);
      }
    }
  }
}
