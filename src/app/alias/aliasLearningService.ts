import { createGroupItemAliasRepository } from '../../infra/groupItemAliasFactory.js';

/**
 * Serviço para gerenciar aprendizado de aliases por grupo
 */
export class AliasLearningService {
  /**
   * Salva ou atualiza um alias manual
   */
  async saveManualAlias(
    groupId: string,
    rawTerm: string,
    canonicalItem: string
  ): Promise<void> {
    const repository = createGroupItemAliasRepository();
    if (!repository) {
      // Se não há repositório (MEMORY mode), não salva
      return;
    }

    await repository.upsert({
      groupId,
      rawTerm,
      canonicalItem,
      source: 'manual',
    });
  }

  /**
   * Busca um alias por grupo e termo
   */
  async findAlias(
    groupId: string,
    rawTerm: string
  ): Promise<{ rawTerm: string; canonicalItem: string } | null> {
    const repository = createGroupItemAliasRepository();
    if (!repository) {
      return null;
    }

    const alias = await repository.findByGroupIdAndRawTerm(groupId, rawTerm);
    if (!alias) {
      return null;
    }

    return {
      rawTerm: alias.rawTerm,
      canonicalItem: alias.canonicalItem,
    };
  }

  /**
   * Lista todos os aliases de um grupo
   */
  async listAliases(
    groupId: string
  ): Promise<
    Array<{ rawTerm: string; canonicalItem: string; source: string }>
  > {
    const repository = createGroupItemAliasRepository();
    if (!repository) {
      return [];
    }

    const aliases = await repository.findByGroupId(groupId);
    return aliases.map((alias) => ({
      rawTerm: alias.rawTerm,
      canonicalItem: alias.canonicalItem,
      source: alias.source,
    }));
  }

  /**
   * Salva alias de feedback
   */
  async saveFeedbackAlias(
    groupId: string,
    rawTerm: string,
    canonicalItem: string
  ): Promise<void> {
    const repository = createGroupItemAliasRepository();
    if (!repository) {
      return;
    }

    await repository.upsert({
      groupId,
      rawTerm,
      canonicalItem,
      source: 'feedback',
    });
  }

  /**
   * Salva alias auto-promovido
   */
  async saveAutoPromotedAlias(
    groupId: string,
    rawTerm: string,
    canonicalItem: string
  ): Promise<void> {
    const repository = createGroupItemAliasRepository();
    if (!repository) {
      return;
    }

    await repository.upsert({
      groupId,
      rawTerm,
      canonicalItem,
      source: 'auto_promoted',
    });
  }
}
