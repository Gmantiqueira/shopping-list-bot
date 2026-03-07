import { ImplicitCorrectionTracker } from './implicitCorrectionTracker.js';
import { ItemFeedbackService } from './itemFeedbackService.js';

/**
 * Serviço para detectar e processar correções implícitas
 */
export class ImplicitCorrectionService {
  private tracker = new ImplicitCorrectionTracker();
  private feedbackService = new ItemFeedbackService();

  /**
   * Registra uma remoção de item para possível correção implícita
   */
  recordRemoval(groupId: string, userId: string, itemName: string): void {
    this.tracker.recordRemoval(groupId, userId, itemName);
  }

  /**
   * Verifica se há correção implícita e processa
   */
  async checkAndProcessImplicitCorrection(
    groupId: string,
    userId: string,
    addedItems: string[],
    rawText: string
  ): Promise<void> {
    // Só processa se houver exatamente 1 item adicionado
    if (addedItems.length !== 1) {
      return;
    }

    const recentRemoval = this.tracker.getRecentRemoval(groupId, userId);
    if (!recentRemoval) {
      return;
    }

    const wrongItem = recentRemoval.removedItem;
    const correctItem = addedItems[0];

    // Não processa se forem iguais (normalizado)
    if (wrongItem.toLowerCase().trim() === correctItem.toLowerCase().trim()) {
      this.tracker.clearRemoval(groupId, userId);
      return;
    }

    // Registra feedback de correção (a promoção é feita automaticamente pelo ItemFeedbackService)
    await this.feedbackService
      .recordReplace(groupId, userId, rawText, [wrongItem], [correctItem])
      .catch((error) => {
        console.warn('Failed to record implicit correction feedback:', error);
      });

    // Limpa o contexto após processar
    this.tracker.clearRemoval(groupId, userId);
  }
}
