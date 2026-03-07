import { AliasLearningService } from './aliasLearningService.js';
import { getPrismaClient } from '../../infra/prisma/prismaClient.js';

/**
 * Serviço para promover correções recorrentes para aliases persistentes
 */
export class AliasPromotionService {
  private aliasService = new AliasLearningService();

  /**
   * Verifica e promove correção recorrente para alias
   */
  async checkAndPromote(
    groupId: string,
    wrongItems: string[],
    correctItems: string[]
  ): Promise<void> {
    try {
      const repoType =
        (process.env.REPOSITORY_TYPE as 'MEMORY' | 'PRISMA') || 'MEMORY';

      if (repoType !== 'PRISMA') {
        return;
      }

      // Só promove se for exatamente 1 item errado e 1 correto
      if (wrongItems.length !== 1 || correctItems.length !== 1) {
        return;
      }

      const rawTerm = wrongItems[0].toLowerCase().trim();
      const canonicalItem = correctItems[0].toLowerCase().trim();

      // Não promove se forem iguais
      if (rawTerm === canonicalItem) {
        return;
      }

      // Verifica se já existe alias manual (não sobrescreve)
      const existingAlias = await this.aliasService.findAlias(groupId, rawTerm);
      if (existingAlias && existingAlias.canonicalItem !== canonicalItem) {
        // Se existe alias manual diferente, não sobrescreve
        return;
      }

      // Conta quantas vezes esse padrão foi registrado
      const count = await this.countFeedbackOccurrences(
        groupId,
        rawTerm,
        canonicalItem
      );

      // Se tiver 3 ou mais, promove para alias
      if (count >= 3) {
        await this.aliasService.saveAutoPromotedAlias(
          groupId,
          rawTerm,
          canonicalItem
        );
      }
    } catch (error) {
      // Não quebra o fluxo se falhar
      console.warn('Failed to check alias promotion:', error);
    }
  }

  /**
   * Conta ocorrências de feedback com o mesmo padrão
   */
  private async countFeedbackOccurrences(
    groupId: string,
    rawTerm: string,
    canonicalItem: string
  ): Promise<number> {
    const prisma = getPrismaClient();

    // Busca todos os feedbacks de replace e alias_manual do grupo
    const allFeedbacks = await prisma.itemFeedback.findMany({
      where: {
        groupId,
        feedbackType: {
          in: ['replace', 'alias_manual'],
        },
      },
    });

    let count = 0;
    for (const feedback of allFeedbacks) {
      try {
        const wrongItems = feedback.wrongItemsJson
          ? JSON.parse(feedback.wrongItemsJson)
          : [];
        const correctItems = feedback.correctItemsJson
          ? JSON.parse(feedback.correctItemsJson)
          : [];

        // Verifica se é o mesmo padrão (normalizado)
        if (
          wrongItems.length === 1 &&
          correctItems.length === 1 &&
          wrongItems[0].toLowerCase().trim() === rawTerm &&
          correctItems[0].toLowerCase().trim() === canonicalItem
        ) {
          count++;
        }
      } catch {
        // Ignora feedbacks com JSON inválido
      }
    }

    return count;
  }
}
