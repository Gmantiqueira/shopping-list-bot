import { createItemFeedbackRepository } from '../../infra/itemFeedbackFactory.js';
import type { CreateItemFeedbackInput } from '../../domain/types.js';
import { AliasPromotionService } from '../alias/aliasPromotionService.js';

/**
 * Serviço para registrar feedback de correção de itens
 */
export class ItemFeedbackService {
  private promotionService = new AliasPromotionService();
  /**
   * Registra feedback de substituição de itens
   */
  async recordReplace(
    groupId: string,
    userId: string,
    rawText: string,
    wrongItems: string[],
    correctItems: string[],
    parseEventId?: string
  ): Promise<void> {
    await this.save({
      parseEventId,
      groupId,
      userId,
      rawText,
      wrongItems,
      correctItems,
      feedbackType: 'replace',
    });
  }

  /**
   * Registra feedback de remoção de falso positivo
   */
  async recordRemoveFalsePositive(
    groupId: string,
    userId: string,
    rawText: string,
    wrongItems: string[],
    parseEventId?: string
  ): Promise<void> {
    await this.save({
      parseEventId,
      groupId,
      userId,
      rawText,
      wrongItems,
      feedbackType: 'remove_false_positive',
    });
  }

  /**
   * Registra feedback de adição de item faltante
   */
  async recordAddMissingItem(
    groupId: string,
    userId: string,
    rawText: string,
    correctItems: string[],
    parseEventId?: string
  ): Promise<void> {
    await this.save({
      parseEventId,
      groupId,
      userId,
      rawText,
      correctItems,
      feedbackType: 'add_missing_item',
    });
  }

  /**
   * Registra feedback de alias manual
   */
  async recordAliasManual(
    groupId: string,
    userId: string,
    rawText: string,
    wrongItems: string[],
    correctItems: string[],
    parseEventId?: string
  ): Promise<void> {
    await this.save({
      parseEventId,
      groupId,
      userId,
      rawText,
      wrongItems,
      correctItems,
      feedbackType: 'alias_manual',
    });
  }

  /**
   * Salva feedback genérico
   */
  private async save(input: CreateItemFeedbackInput): Promise<void> {
    try {
      const repository = createItemFeedbackRepository();
      if (!repository) {
        // Se não há repositório (MEMORY mode), não salva
        return;
      }

      await repository.save(input);

      // Verifica se deve promover para alias (após salvar)
      if (
        (input.feedbackType === 'replace' ||
          input.feedbackType === 'alias_manual') &&
        input.wrongItems &&
        input.correctItems
      ) {
        await this.promotionService
          .checkAndPromote(input.groupId, input.wrongItems, input.correctItems)
          .catch((error) => {
            console.warn('Failed to check alias promotion:', error);
          });
      }
    } catch (error) {
      // Loga erro mas não quebra o fluxo
      console.warn('Error saving item feedback:', error);
    }
  }
}
