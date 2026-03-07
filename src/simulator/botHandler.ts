import { ListService } from '../domain/listService.js';
import { MessengerConsole } from './messengerConsole.js';
import { ResponseFormatter } from '../app/responses/responseFormatter.js';
import { ConfirmationManager } from '../app/responses/confirmationManager.js';
import type { ParseInput } from '../app/parser/types.js';
import type { ShoppingItem } from '../domain/types.js';
import { AliasLearningService } from '../app/alias/aliasLearningService.js';
import { ItemFeedbackService } from '../app/feedback/itemFeedbackService.js';
import { ImplicitCorrectionService } from '../app/feedback/implicitCorrectionService.js';
import { parseMessage } from '../app/parser/parseMessage.js';

export class BotHandler {
  private confirmationManager = new ConfirmationManager();
  private formatter = new ResponseFormatter();
  private aliasLearningService = new AliasLearningService();
  private itemFeedbackService = new ItemFeedbackService();
  private implicitCorrectionService = new ImplicitCorrectionService();

  constructor(
    private readonly listService: ListService,
    private readonly console: MessengerConsole
  ) {}

  async handleMessage(input: ParseInput): Promise<void> {
    const { text, groupId, userId } = input;

    // Mostra mensagem do usuário
    this.console.printUserMessage(groupId, userId, text);

    // Verifica se há confirmação pendente
    const confirmedCommand = this.confirmationManager.checkAndConsume(
      groupId,
      userId,
      text
    );

    if (confirmedCommand === 'CLEAR') {
      await this.executeClear(groupId);
      return;
    }

    // Usar parseMessage para suportar ALIAS_LEARN
    const parsed = await parseMessage(input);

    // Processa comando ou itens
    switch (parsed.type) {
      case 'COMMAND_LIST':
        await this.handleList(groupId);
        break;

      case 'COMMAND_CLEAR':
        await this.handleClear(groupId, userId);
        break;

      case 'COMMAND_REMOVE':
        await this.handleRemove(groupId, parsed.name, userId);
        break;

      case 'COMMAND_BOUGHT':
        await this.handleBought(groupId, parsed.name, userId);
        break;

      case 'COMMAND_LIST_ALIASES':
        await this.handleListAliases(groupId);
        break;

      case 'ITEMS':
        // Para ITEMS, ainda usa o parser antigo para compatibilidade
        // Mas parseMessage já foi chamado, então usa o resultado
        await this.handleAddItems(groupId, userId, parsed.items, text);
        break;

      case 'ALIAS_LEARN':
        // Salvar alias aprendido
        await this.aliasLearningService
          .saveManualAlias(groupId, parsed.raw, parsed.canonical)
          .catch((error) => {
            console.warn('Failed to save alias:', error);
          });

        // Registrar em ItemFeedback
        await this.itemFeedbackService
          .recordAliasManual(
            groupId,
            userId,
            text,
            [parsed.raw],
            [parsed.canonical]
          )
          .catch((error) => {
            console.warn('Failed to save feedback:', error);
          });

        this.console.printBotMessage(
          groupId,
          `✔ Aprendi: ${parsed.raw} → ${parsed.canonical}`
        );
        break;

      case 'IGNORE':
        // Não faz nada para mensagens ignoradas
        break;
    }
  }

  private async handleList(groupId: string): Promise<void> {
    const items = await this.listService.listItems(groupId);
    const message = this.formatter.formatList(items);
    this.console.printBotMessage(groupId, message);
  }

  private async handleClear(groupId: string, userId: string): Promise<void> {
    // Solicita confirmação
    this.confirmationManager.requestClear(groupId, userId);
    const message = this.formatter.formatClearConfirmation();
    this.console.printBotMessage(groupId, message);
  }

  private async executeClear(groupId: string): Promise<void> {
    await this.listService.clearList(groupId);
    const message = this.formatter.formatClearSuccess();
    this.console.printBotMessage(groupId, message);
  }

  private async handleRemove(
    groupId: string,
    name: string,
    userId: string
  ): Promise<void> {
    const removed = await this.listService.removeItemByName(groupId, name);

    // Registra remoção para possível correção implícita
    if (removed) {
      this.implicitCorrectionService.recordRemoval(groupId, userId, name);
    }

    const message = this.formatter.formatRemove(removed, name);
    this.console.printBotMessage(groupId, message);
  }

  private async handleBought(
    groupId: string,
    name: string,
    userId: string
  ): Promise<void> {
    const marked = await this.listService.markBoughtByName(
      groupId,
      name,
      userId
    );
    const message = this.formatter.formatBought(marked, name);
    this.console.printBotMessage(groupId, message);
  }

  private async handleAddItems(
    groupId: string,
    userId: string,
    items: ShoppingItem[],
    rawText: string
  ): Promise<void> {
    const result = await this.listService.addItems(groupId, userId, items);

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
    this.console.printBotMessage(groupId, message);
  }

  private async handleListAliases(groupId: string): Promise<void> {
    const aliases = await this.aliasLearningService.listAliases(groupId);
    const message = this.formatter.formatAliasesList(aliases);
    this.console.printBotMessage(groupId, message);
  }
}
