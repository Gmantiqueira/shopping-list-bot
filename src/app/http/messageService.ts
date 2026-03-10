import { ListService } from '../../domain/listService.js';
import { ResponseFormatter } from '../responses/responseFormatter.js';
import { ConfirmationManager } from '../responses/confirmationManager.js';
import type { ParseInput } from '../parser/types.js';
import type { Item, ShoppingItem } from '../../domain/types.js';
import { parseMessage } from '../parser/parseMessage.js';
import { getOrCreateCustomerByPhone } from '../../infra/prisma/customerRepository.js';
import {
  findValidPendingByGroupId,
  savePendingConfirmation,
  deletePendingConfirmation,
} from '../../infra/prisma/pendingItemConfirmationRepository.js';
import { AliasLearningService } from '../alias/aliasLearningService.js';
import { ItemFeedbackService } from '../feedback/itemFeedbackService.js';
import { ImplicitCorrectionService } from '../feedback/implicitCorrectionService.js';

export interface MessageResult {
  success: boolean;
  message?: string;
  data?: {
    items?: Item[];
    added?: string[];
    duplicated?: string[];
  };
}

export class HttpMessageService {
  private confirmationManager = new ConfirmationManager();
  private formatter = new ResponseFormatter();
  private aliasLearningService = new AliasLearningService();
  private itemFeedbackService = new ItemFeedbackService();
  private implicitCorrectionService = new ImplicitCorrectionService();

  constructor(private readonly listService: ListService) {}

  async handleMessage(input: ParseInput): Promise<MessageResult> {
    const { text, groupId, userId } = input;

    // Verifica se há confirmação pendente
    const confirmedCommand = this.confirmationManager.checkAndConsume(
      groupId,
      userId,
      text
    );

    if (confirmedCommand === 'CLEAR') {
      return await this.executeClear(groupId);
    }

    const replyNorm = text.trim().toLowerCase().replace(/\s+/g, ' ');
    const pending = await findValidPendingByGroupId(groupId);
    if (pending) {
      if (['1', 'sim', 'ok', 'okay'].includes(replyNorm)) {
        const confirmInput = { ...input, text: pending.rawText };
        const reParsed = await parseMessage(confirmInput);
        await deletePendingConfirmation(pending.id);
        if (reParsed.type === 'ITEMS') {
          return await this.handleAddItems(
            groupId,
            userId,
            reParsed.items,
            pending.rawText,
            input.listId
          );
        }
      }
      if (['2', 'não', 'nao', 'cancelar'].includes(replyNorm)) {
        await deletePendingConfirmation(pending.id);
        return { success: true, message: 'Cancelado. Nenhum item adicionado.' };
      }
      await deletePendingConfirmation(pending.id);
    }

    const parsed = await parseMessage(input);

    switch (parsed.type) {
      case 'COMMAND_LIST':
        return await this.handleList(input.groupId);

      case 'COMMAND_CLEAR':
        return await this.handleClear(input.groupId, input.userId);

      case 'COMMAND_REMOVE':
        return await this.handleRemove(
          input.groupId,
          parsed.name,
          input.userId
        );

      case 'COMMAND_BOUGHT':
        return await this.handleBought(
          input.groupId,
          parsed.name,
          input.userId
        );

      case 'COMMAND_LIST_ALIASES':
        return await this.handleListAliases(input.groupId);

      case 'ITEMS': {
        const { confidence } = parsed;
        if (confidence >= 0.7) {
          return await this.handleAddItems(
            input.groupId,
            input.userId,
            parsed.items,
            input.text,
            input.listId
          );
        }
        if (confidence >= 0.3) {
          await savePendingConfirmation(input.groupId, input.text);
          const msg =
            'Não tenho certeza se isso é um item da lista.\n\n' +
            `Você quis adicionar:\n"${input.text}"?\n\n` +
            'Responda:\n1 para confirmar\n2 para cancelar';
          return { success: false, message: msg };
        }
        return {
          success: false,
          message:
            'Não entendi como item de lista. Envie algo como: 2 arroz, leite, ou pão.',
        };
      }

      case 'NAME_REGISTRATION':
        await getOrCreateCustomerByPhone(input.groupId, parsed.name);
        return {
          success: true,
          message: `✔ Nome atualizado: ${parsed.name}`,
        };

      case 'ALIAS_LEARN':
        // Salvar alias aprendido
        await this.aliasLearningService
          .saveManualAlias(input.groupId, parsed.raw, parsed.canonical)
          .catch((error: unknown) => {
            console.warn('Failed to save alias:', error);
          });

        // Registrar em ItemFeedback
        await this.itemFeedbackService
          .recordAliasManual(
            input.groupId,
            input.userId,
            input.text,
            [parsed.raw],
            [parsed.canonical]
          )
          .catch((error: unknown) => {
            console.warn('Failed to save feedback:', error);
          });

        return {
          success: true,
          message: `✔ Aprendi: ${parsed.raw} → ${parsed.canonical}`,
        };

      case 'IGNORE':
        return {
          success: true,
          message: 'Mensagem ignorada',
        };
    }
  }

  private async handleList(groupId: string): Promise<MessageResult> {
    const items = await this.listService.listItems(groupId);
    const message = this.formatter.formatList(items);
    return {
      success: true,
      message,
      data: { items },
    };
  }

  private async handleClear(
    groupId: string,
    userId: string
  ): Promise<MessageResult> {
    // Solicita confirmação
    this.confirmationManager.requestClear(groupId, userId);
    const message = this.formatter.formatClearConfirmation();
    return {
      success: false,
      message,
    };
  }

  private async executeClear(groupId: string): Promise<MessageResult> {
    await this.listService.clearList(groupId);
    const message = this.formatter.formatClearSuccess();
    return {
      success: true,
      message,
    };
  }

  private async handleRemove(
    groupId: string,
    name: string,
    userId: string
  ): Promise<MessageResult> {
    const removed = await this.listService.removeItemByName(groupId, name);

    // Registra remoção para possível correção implícita
    if (removed) {
      this.implicitCorrectionService.recordRemoval(groupId, userId, name);
    }

    const message = this.formatter.formatRemove(removed, name);
    return {
      success: removed,
      message,
    };
  }

  private async handleBought(
    groupId: string,
    name: string,
    userId: string
  ): Promise<MessageResult> {
    const marked = await this.listService.markBoughtByName(
      groupId,
      name,
      userId
    );
    const message = this.formatter.formatBought(marked, name);
    return {
      success: marked,
      message,
    };
  }

  private async handleListAliases(groupId: string): Promise<MessageResult> {
    const aliases = await this.aliasLearningService.listAliases(groupId);
    const message = this.formatter.formatAliasesList(aliases);
    return { success: true, message };
  }

  private async handleAddItems(
    groupId: string,
    userId: string,
    items: ShoppingItem[],
    rawText: string,
    listId?: string
  ): Promise<MessageResult> {
    const result = await this.listService.addItems(
      groupId,
      userId,
      items,
      listId
    );

    // Verifica se há correção implícita (remove seguido de add)
    if (result.added.length > 0) {
      await this.implicitCorrectionService
        .checkAndProcessImplicitCorrection(
          groupId,
          userId,
          result.added.map((i) => i.name),
          rawText
        )
        .catch((error) => {
          console.warn('Failed to process implicit correction:', error);
        });
    }

    const message = this.formatter.formatBatchSummary(result);
    return {
      success: result.added.length > 0 || result.duplicated.length > 0,
      message,
      data: {
        added: result.added.map((i) => i.name),
        duplicated: result.duplicated.map((item) => item.name),
      },
    };
  }
}
