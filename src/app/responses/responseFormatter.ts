import type { Item, AddItemsResult } from '../../domain/types.js';
import { formatItem } from '../../domain/itemUtils.js';

export class ResponseFormatter {
  formatBatchSummary(result: AddItemsResult): string {
    const { added, duplicated } = result;

    if (added.length === 0 && duplicated.length === 0) {
      return '❌ Nenhum item adicionado';
    }

    const parts: string[] = [];

    // Formata itens adicionados
    if (added.length > 0) {
      const itemNames = this.formatItemList(
        added.map((i) =>
          formatItem({ name: i.name, quantity: i.quantity, unit: i.unit })
        )
      );
      const count = added.length;
      const verb = count === 1 ? 'item' : 'itens';
      parts.push(`✔ Adicionei ${count} ${verb}: ${itemNames}`);
    }

    // Formata duplicados
    if (duplicated.length > 0) {
      const dupNames = this.formatItemList(
        duplicated.map((item) => formatItem(item))
      );
      parts.push(`⚠ Já estavam na lista: ${dupNames}`);
    }

    return parts.join('\n');
  }

  formatList(items: Item[]): string {
    if (items.length === 0) {
      return '📝 Lista vazia';
    }

    const pendingItems = items.filter((item) => item.status === 'pending');
    const boughtItems = items.filter((item) => item.status === 'bought');

    const parts: string[] = [];

    if (pendingItems.length > 0) {
      const pendingLines = pendingItems.map(
        (item) =>
          `- ${formatItem({ name: item.name, quantity: item.quantity, unit: item.unit })}`
      );
      parts.push(...pendingLines);
    }

    if (boughtItems.length > 0) {
      const boughtLines = boughtItems.map((item) => {
        const by = item.boughtBy ? ` (por ${item.boughtBy})` : '';
        return `✔ ${formatItem({ name: item.name, quantity: item.quantity, unit: item.unit })}${by}`;
      });
      parts.push(...boughtLines);
    }

    return parts.join('\n');
  }

  formatRemove(success: boolean, name: string): string {
    return success ? `✔ Removido: ${name}` : `❌ Item não encontrado: ${name}`;
  }

  formatBought(success: boolean, name: string): string {
    return success
      ? `✔ Comprado: ${name}`
      : `❌ Item não encontrado ou já comprado: ${name}`;
  }

  formatClearConfirmation(): string {
    return '⚠ Confirmar? Responda: SIM';
  }

  formatClearSuccess(): string {
    return '🗑️ Lista limpa!';
  }

  formatAliasesList(
    aliases: Array<{ rawTerm: string; canonicalItem: string }>
  ): string {
    if (aliases.length === 0) {
      return 'Ainda não aprendi nenhum apelido neste grupo.';
    }

    // Limitar a 20 aliases
    const limitedAliases = aliases.slice(0, 20);
    const lines = limitedAliases.map(
      (alias) => `${alias.rawTerm} → ${alias.canonicalItem}`
    );

    let message = 'Vocabulário aprendido:\n' + lines.join('\n');

    if (aliases.length > 20) {
      message += `\n... e mais ${aliases.length - 20} apelido(s)`;
    }

    return message;
  }

  private formatItemList(items: string[]): string {
    const maxItems = 8;
    if (items.length <= maxItems) {
      return items.join(', ');
    }

    const shown = items.slice(0, maxItems);
    const remaining = items.length - maxItems;
    return `${shown.join(', ')} ... +${remaining}`;
  }
}
