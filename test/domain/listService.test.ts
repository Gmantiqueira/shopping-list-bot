import { describe, it, expect, beforeEach } from 'vitest';
import { ListService } from '../../src/domain/listService.js';
import { MemoryListItemRepository } from '../../src/infra/memory/memoryRepository.js';

describe('ListService', () => {
  let service: ListService;
  let repository: MemoryListItemRepository;

  beforeEach(() => {
    repository = new MemoryListItemRepository();
    service = new ListService(repository);
  });

  describe('addItems', () => {
    it('should add single item', async () => {
      const result = await service.addItems('group1', 'user1', [
        { name: 'leite' },
      ]);

      expect(result.added).toHaveLength(1);
      expect(result.duplicated).toHaveLength(0);
      expect(result.added[0].name).toBe('leite');
      expect(result.added[0].quantity).toBe(1);
      expect(result.added[0].unit).toBe('un');
      expect(result.added[0].status).toBe('pending');
      expect(result.added[0].groupId).toBe('group1');
      expect(result.added[0].createdBy).toBe('user1');
    });

    it('should add multiple items', async () => {
      const result = await service.addItems('group1', 'user1', [
        { name: 'leite' },
        { name: 'pão' },
        { name: 'manteiga' },
      ]);

      expect(result.added).toHaveLength(3);
      expect(result.duplicated).toHaveLength(0);
    });

    it('should normalize item names', async () => {
      const result = await service.addItems('group1', 'user1', [
        { name: '  LEITE  ' },
        { name: 'Pão Integral' },
        { name: '  manteiga   sem sal  ' },
      ]);

      expect(result.added[0].name).toBe('leite');
      expect(result.added[1].name).toBe('pão integral');
      expect(result.added[2].name).toBe('manteiga sem sal');
    });

    it('should detect duplicate pending items', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const result = await service.addItems('group1', 'user2', [
        { name: 'leite' },
      ]);

      expect(result.added).toHaveLength(0);
      expect(result.duplicated).toHaveLength(1);
      expect(result.duplicated[0].name).toBe('leite');
    });

    it('should detect duplicate with different casing', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const result = await service.addItems('group1', 'user2', [
        { name: 'LEITE' },
      ]);

      expect(result.added).toHaveLength(0);
      expect(result.duplicated).toHaveLength(1);
    });

    it('should detect duplicate with extra spaces', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const result = await service.addItems('group1', 'user2', [
        { name: '  leite  ' },
      ]);

      expect(result.added).toHaveLength(0);
      expect(result.duplicated).toHaveLength(1);
    });

    it('should allow adding same item if already bought', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      await service.markBoughtByName('group1', 'leite', 'user1');

      const result = await service.addItems('group1', 'user2', [
        { name: 'leite' },
      ]);

      expect(result.added).toHaveLength(1);
      expect(result.duplicated).toHaveLength(0);
    });

    it('should handle mixed duplicates and new items', async () => {
      await service.addItems('group1', 'user1', [
        { name: 'leite' },
        { name: 'pão' },
      ]);

      const result = await service.addItems('group1', 'user2', [
        { name: 'leite' },
        { name: 'manteiga' },
        { name: 'pão' },
      ]);

      expect(result.added).toHaveLength(1);
      expect(result.added[0].name).toBe('manteiga');
      expect(result.duplicated).toHaveLength(2);
      expect(result.duplicated.map((i) => i.name)).toContain('leite');
      expect(result.duplicated.map((i) => i.name)).toContain('pão');
    });

    it('should handle empty array', async () => {
      const result = await service.addItems('group1', 'user1', []);

      expect(result.added).toHaveLength(0);
      expect(result.duplicated).toHaveLength(0);
    });

    it('should isolate items by groupId', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const result = await service.addItems('group2', 'user1', [
        { name: 'leite' },
      ]);

      expect(result.added).toHaveLength(1);
      expect(result.duplicated).toHaveLength(0);
    });

    it('should preserve quantity and unit', async () => {
      const result = await service.addItems('group1', 'user1', [
        { name: 'batata', quantity: 2, unit: 'kg' },
        { name: 'leite', quantity: 3 },
        { name: 'pão' },
      ]);

      expect(result.added[0].quantity).toBe(2);
      expect(result.added[0].unit).toBe('kg');
      expect(result.added[1].quantity).toBe(3);
      expect(result.added[1].unit).toBe('un');
      expect(result.added[2].quantity).toBe(1);
      expect(result.added[2].unit).toBe('un');
    });
  });

  describe('listItems', () => {
    it('should return empty array for empty list', async () => {
      const items = await service.listItems('group1');
      expect(items).toHaveLength(0);
    });

    it('should return all items for group', async () => {
      await service.addItems('group1', 'user1', [
        { name: 'leite' },
        { name: 'pão' },
      ]);
      const items = await service.listItems('group1');

      expect(items).toHaveLength(2);
    });

    it('should order pending items before bought items', async () => {
      await service.addItems('group1', 'user1', [
        { name: 'leite' },
        { name: 'pão' },
        { name: 'manteiga' },
      ]);
      await service.markBoughtByName('group1', 'pão', 'user1');

      const items = await service.listItems('group1');

      expect(items).toHaveLength(3);
      expect(items[0].name).toBe('leite');
      expect(items[0].status).toBe('pending');
      expect(items[1].name).toBe('manteiga');
      expect(items[1].status).toBe('pending');
      expect(items[2].name).toBe('pão');
      expect(items[2].status).toBe('bought');
    });

    it('should order by createdAt within same status', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      // Pequeno delay para garantir diferentes timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      await service.addItems('group1', 'user1', [{ name: 'pão' }]);

      const items = await service.listItems('group1');

      expect(items[0].name).toBe('leite');
      expect(items[1].name).toBe('pão');
      expect(items[0].createdAt.getTime()).toBeLessThan(
        items[1].createdAt.getTime()
      );
    });

    it('should isolate items by groupId', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      await service.addItems('group2', 'user1', [{ name: 'pão' }]);

      const items1 = await service.listItems('group1');
      const items2 = await service.listItems('group2');

      expect(items1).toHaveLength(1);
      expect(items1[0].name).toBe('leite');
      expect(items2).toHaveLength(1);
      expect(items2[0].name).toBe('pão');
    });
  });

  describe('removeItemByName', () => {
    it('should remove existing item', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const removed = await service.removeItemByName('group1', 'leite');

      expect(removed).toBe(true);
      const items = await service.listItems('group1');
      expect(items).toHaveLength(0);
    });

    it('should normalize name before removing', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const removed = await service.removeItemByName('group1', '  LEITE  ');

      expect(removed).toBe(true);
    });

    it('should return false if item does not exist', async () => {
      const removed = await service.removeItemByName('group1', 'leite');
      expect(removed).toBe(false);
    });

    it('should return false if item is in different group', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const removed = await service.removeItemByName('group2', 'leite');

      expect(removed).toBe(false);
    });

    it('should remove bought items', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      await service.markBoughtByName('group1', 'leite', 'user1');
      const removed = await service.removeItemByName('group1', 'leite');

      expect(removed).toBe(true);
    });
  });

  describe('markBoughtByName', () => {
    it('should mark pending item as bought', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const marked = await service.markBoughtByName('group1', 'leite', 'user2');

      expect(marked).toBe(true);
      const items = await service.listItems('group1');
      expect(items[0].status).toBe('bought');
      expect(items[0].boughtBy).toBe('user2');
      expect(items[0].boughtAt).toBeInstanceOf(Date);
    });

    it('should normalize name before marking', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const marked = await service.markBoughtByName(
        'group1',
        '  LEITE  ',
        'user2'
      );

      expect(marked).toBe(true);
    });

    it('should return false if item does not exist', async () => {
      const marked = await service.markBoughtByName('group1', 'leite', 'user1');
      expect(marked).toBe(false);
    });

    it('should return false if item is already bought', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      await service.markBoughtByName('group1', 'leite', 'user1');
      const marked = await service.markBoughtByName('group1', 'leite', 'user2');

      expect(marked).toBe(false);
    });

    it('should return false if item is in different group', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const marked = await service.markBoughtByName('group2', 'leite', 'user1');

      expect(marked).toBe(false);
    });

    it('should update boughtBy and boughtAt', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      const before = new Date();
      await service.markBoughtByName('group1', 'leite', 'user2');
      const after = new Date();

      const items = await service.listItems('group1');
      expect(items[0].boughtBy).toBe('user2');
      expect(items[0].boughtAt).toBeInstanceOf(Date);
      if (items[0].boughtAt) {
        expect(items[0].boughtAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime()
        );
        expect(items[0].boughtAt.getTime()).toBeLessThanOrEqual(
          after.getTime()
        );
      }
    });
  });

  describe('clearList', () => {
    it('should remove all items from group', async () => {
      await service.addItems('group1', 'user1', [
        { name: 'leite' },
        { name: 'pão' },
        { name: 'manteiga' },
      ]);
      await service.clearList('group1');

      const items = await service.listItems('group1');
      expect(items).toHaveLength(0);
    });

    it('should only clear items from specified group', async () => {
      await service.addItems('group1', 'user1', [{ name: 'leite' }]);
      await service.addItems('group2', 'user1', [{ name: 'pão' }]);

      await service.clearList('group1');

      const items1 = await service.listItems('group1');
      const items2 = await service.listItems('group2');

      expect(items1).toHaveLength(0);
      expect(items2).toHaveLength(1);
      expect(items2[0].name).toBe('pão');
    });

    it('should handle clearing empty list', async () => {
      await expect(service.clearList('group1')).resolves.not.toThrow();
    });

    it('should clear both pending and bought items', async () => {
      await service.addItems('group1', 'user1', [
        { name: 'leite' },
        { name: 'pão' },
      ]);
      await service.markBoughtByName('group1', 'leite', 'user1');
      await service.clearList('group1');

      const items = await service.listItems('group1');
      expect(items).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle items with same normalized name but different original', async () => {
      await service.addItems('group1', 'user1', [{ name: 'Leite' }]);
      const result = await service.addItems('group1', 'user2', [
        { name: '  LEITE  ' },
      ]);

      expect(result.duplicated).toHaveLength(1);
    });

    it('should handle multiple spaces in item names', async () => {
      const result = await service.addItems('group1', 'user1', [
        { name: 'leite   integral' },
      ]);

      expect(result.added[0].name).toBe('leite integral');
    });

    it('should handle very long item names', async () => {
      const longName = 'a'.repeat(100);
      const result = await service.addItems('group1', 'user1', [
        { name: longName },
      ]);

      expect(result.added[0].name).toBe(longName.toLowerCase());
    });

    it('should handle special characters in names', async () => {
      const result = await service.addItems('group1', 'user1', [
        { name: 'leite (integral)' },
        { name: 'pão - francês' },
      ]);

      expect(result.added[0].name).toBe('leite (integral)');
      expect(result.added[1].name).toBe('pão - francês');
    });
  });
});
