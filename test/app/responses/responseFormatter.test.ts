import { describe, it, expect } from 'vitest';
import { ResponseFormatter } from '../../../src/app/responses/responseFormatter.js';
import type { AddItemsResult, Item } from '../../../src/domain/types.js';

describe('ResponseFormatter', () => {
  const formatter = new ResponseFormatter();

  describe('formatBatchSummary', () => {
    it('should format single added item', () => {
      const result: AddItemsResult = {
        added: [
          {
            id: '1',
            listId: 'list-1',
            groupId: 'g1',
            name: 'leite',
            quantity: 1,
            unit: 'un',
            status: 'pending',
            createdBy: 'u1',
            createdAt: new Date(),
          },
        ],
        duplicated: [],
      };

      const message = formatter.formatBatchSummary(result);
      expect(message).toBe('✔ Adicionei 1 item: 1 leite');
    });

    it('should format multiple added items', () => {
      const result: AddItemsResult = {
        added: [
          {
            id: '1',
            listId: 'list-1',
            groupId: 'g1',
            name: 'leite',
            quantity: 1,
            unit: 'un',
            status: 'pending',
            createdBy: 'u1',
            createdAt: new Date(),
          },
          {
            id: '2',
            listId: 'list-1',
            groupId: 'g1',
            name: 'pão',
            quantity: 1,
            unit: 'un',
            status: 'pending',
            createdBy: 'u1',
            createdAt: new Date(),
          },
        ],
        duplicated: [],
      };

      const message = formatter.formatBatchSummary(result);
      expect(message).toBe('✔ Adicionei 2 itens: 1 leite, 1 pão');
    });

    it('should format with duplicated items', () => {
      const result: AddItemsResult = {
        added: [
          {
            id: '1',
            listId: 'list-1',
            groupId: 'g1',
            name: 'leite',
            quantity: 1,
            unit: 'un',
            status: 'pending',
            createdBy: 'u1',
            createdAt: new Date(),
          },
        ],
        duplicated: [{ name: 'pão' }],
      };

      const message = formatter.formatBatchSummary(result);
      expect(message).toBe(
        '✔ Adicionei 1 item: 1 leite\n⚠ Já estavam na lista: 1 pão'
      );
    });

    it('should format only duplicated items', () => {
      const result: AddItemsResult = {
        added: [],
        duplicated: [{ name: 'leite' }, { name: 'pão' }],
      };

      const message = formatter.formatBatchSummary(result);
      expect(message).toBe('⚠ Já estavam na lista: 1 leite, 1 pão');
    });

    it('should truncate long lists', () => {
      const result: AddItemsResult = {
        added: Array.from({ length: 10 }, (_, i) => ({
          id: `${i}`,
          listId: 'list-1',
          groupId: 'g1',
          name: `item${i + 1}`,
          quantity: 1,
          unit: 'un',
          status: 'pending' as const,
          createdBy: 'u1',
          createdAt: new Date(),
        })),
        duplicated: [],
      };

      const message = formatter.formatBatchSummary(result);
      expect(message).toContain('... +2');
      expect(message).toContain('1 item1');
      expect(message).toContain('1 item2');
      expect(message).not.toContain('item10');
    });

    it('should handle empty result', () => {
      const result: AddItemsResult = {
        added: [],
        duplicated: [],
      };

      const message = formatter.formatBatchSummary(result);
      expect(message).toBe('❌ Nenhum item adicionado');
    });
  });

  describe('formatList', () => {
    it('should format empty list', () => {
      const message = formatter.formatList([]);
      expect(message).toBe('📝 Lista vazia');
    });

    it('should format list with pending items', () => {
      const items: Item[] = [
        {
          id: '1',
          listId: 'list-1',
          groupId: 'g1',
          name: 'leite',
          quantity: 1,
          unit: 'un',
          status: 'pending',
          createdBy: 'u1',
          createdAt: new Date(),
        },
        {
          id: '2',
          listId: 'list-1',
          groupId: 'g1',
          name: 'pão',
          quantity: 1,
          unit: 'un',
          status: 'pending',
          createdBy: 'u1',
          createdAt: new Date(),
        },
      ];

      const message = formatter.formatList(items);
      expect(message).toBe('- 1 leite\n- 1 pão');
    });

    it('should format list with bought items', () => {
      const items: Item[] = [
        {
          id: '1',
          listId: 'list-1',
          groupId: 'g1',
          name: 'leite',
          quantity: 1,
          unit: 'un',
          status: 'bought',
          createdBy: 'u1',
          createdAt: new Date(),
          boughtBy: 'u2',
          boughtAt: new Date(),
        },
      ];

      const message = formatter.formatList(items);
      expect(message).toBe('✔ 1 leite (por u2)');
    });

    it('should format list with pending and bought items', () => {
      const items: Item[] = [
        {
          id: '1',
          listId: 'list-1',
          groupId: 'g1',
          name: 'leite',
          quantity: 1,
          unit: 'un',
          status: 'pending',
          createdBy: 'u1',
          createdAt: new Date(),
        },
        {
          id: '2',
          listId: 'list-1',
          groupId: 'g1',
          name: 'pão',
          quantity: 1,
          unit: 'un',
          status: 'bought',
          createdBy: 'u1',
          createdAt: new Date(),
          boughtBy: 'u2',
          boughtAt: new Date(),
        },
      ];

      const message = formatter.formatList(items);
      expect(message).toBe('- 1 leite\n✔ 1 pão (por u2)');
    });

    it('should format bought item without buyer', () => {
      const items: Item[] = [
        {
          id: '1',
          listId: 'list-1',
          groupId: 'g1',
          name: 'leite',
          quantity: 1,
          unit: 'un',
          status: 'bought',
          createdBy: 'u1',
          createdAt: new Date(),
          boughtAt: new Date(),
        },
      ];

      const message = formatter.formatList(items);
      expect(message).toBe('✔ 1 leite');
    });
  });

  describe('formatRemove', () => {
    it('should format successful removal', () => {
      const message = formatter.formatRemove(true, 'leite');
      expect(message).toBe('✔ Removido: leite');
    });

    it('should format failed removal', () => {
      const message = formatter.formatRemove(false, 'leite');
      expect(message).toBe('❌ Item não encontrado: leite');
    });
  });

  describe('formatBought', () => {
    it('should format successful bought', () => {
      const message = formatter.formatBought(true, 'leite');
      expect(message).toBe('✔ Comprado: leite');
    });

    it('should format failed bought', () => {
      const message = formatter.formatBought(false, 'leite');
      expect(message).toBe('❌ Item não encontrado ou já comprado: leite');
    });
  });

  describe('formatClearConfirmation', () => {
    it('should format confirmation message', () => {
      const message = formatter.formatClearConfirmation();
      expect(message).toBe('⚠ Confirmar? Responda: SIM');
    });
  });

  describe('formatClearSuccess', () => {
    it('should format success message', () => {
      const message = formatter.formatClearSuccess();
      expect(message).toBe('🗑️ Lista limpa!');
    });
  });
});
