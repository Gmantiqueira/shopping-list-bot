import { describe, it, expect } from 'vitest';
import { extractItemsByRules } from '../../../src/app/parser/extractItemsByRules.js';

describe('extractItemsByRules', () => {
  describe('single item', () => {
    it('should extract single item "leite"', () => {
      const result = extractItemsByRules('leite');
      expect(result).toEqual(['leite']);
    });

    it('should extract single item with spaces', () => {
      const result = extractItemsByRules('  leite  ');
      expect(result).toEqual(['leite']);
    });
  });

  describe('multiple lines', () => {
    it('should extract items from multiple lines', () => {
      const result = extractItemsByRules('leite\narroz\nmaçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should handle multiple lines with empty lines', () => {
      const result = extractItemsByRules('leite\n\narroz\n\nmaçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should handle multiple lines with spaces', () => {
      const result = extractItemsByRules('  leite  \n  arroz  \n  maçã  ');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });
  });

  describe('comma separated', () => {
    it('should extract items separated by comma', () => {
      const result = extractItemsByRules('leite, arroz, maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should handle comma without spaces', () => {
      const result = extractItemsByRules('leite,arroz,maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should handle comma with extra spaces', () => {
      const result = extractItemsByRules('leite , arroz , maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });
  });

  describe('connectors', () => {
    it('should extract items with " e " connector', () => {
      const result = extractItemsByRules('leite e arroz e maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should extract items with " + " connector', () => {
      const result = extractItemsByRules('leite + arroz + maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should extract items with " / " connector', () => {
      const result = extractItemsByRules('leite / arroz / maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should extract items with " & " connector', () => {
      const result = extractItemsByRules('leite & arroz & maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should handle mixed case connectors', () => {
      const result = extractItemsByRules('leite E arroz E maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });
  });

  describe('quantities', () => {
    it('should preserve quantities with items', () => {
      const result = extractItemsByRules('2kg batata e 3 coca');
      expect(result).toEqual(['2kg batata', '3 coca']);
    });

    it('should preserve quantities with comma', () => {
      const result = extractItemsByRules('2kg batata, 3 coca, 1kg açúcar');
      expect(result).toEqual(['2kg batata', '3 coca', '1kg açúcar']);
    });

    it('should preserve quantities with multiple lines', () => {
      const result = extractItemsByRules('2kg batata\n3 coca\n1kg açúcar');
      expect(result).toEqual(['2kg batata', '3 coca', '1kg açúcar']);
    });
  });

  describe('compound terms', () => {
    it('should preserve "coca-cola" as single item', () => {
      const result = extractItemsByRules('coca-cola');
      expect(result).toEqual(['coca-cola']);
    });

    it('should preserve "papel toalha" as single item', () => {
      const result = extractItemsByRules('papel toalha');
      expect(result).toEqual(['papel toalha']);
    });

    it('should preserve "molho de tomate" as single item', () => {
      const result = extractItemsByRules('molho de tomate');
      expect(result).toEqual(['molho de tomate']);
    });

    it('should preserve compound terms with connectors', () => {
      const result = extractItemsByRules('leite e papel toalha e coca-cola');
      expect(result).toEqual(['leite', 'papel toalha', 'coca-cola']);
    });

    it('should preserve compound terms with comma', () => {
      const result = extractItemsByRules('leite, papel toalha, coca-cola');
      expect(result).toEqual(['leite', 'papel toalha', 'coca-cola']);
    });
  });

  describe('unclear extraction', () => {
    it('should return single item if extraction is unclear', () => {
      const result = extractItemsByRules('leite maçã coca-cola');
      expect(result).toEqual(['leite maçã coca-cola']);
    });

    it('should return single item for complex phrase', () => {
      const result = extractItemsByRules(
        'preciso de leite e arroz para fazer bolo'
      );
      expect(result).toEqual(['preciso de leite e arroz para fazer bolo']);
    });
  });

  describe('cleaning', () => {
    it('should remove punctuation at start', () => {
      const result = extractItemsByRules('.leite, arroz');
      expect(result).toEqual(['leite', 'arroz']);
    });

    it('should remove punctuation at end', () => {
      const result = extractItemsByRules('leite., arroz.');
      expect(result).toEqual(['leite', 'arroz']);
    });

    it('should remove empty items', () => {
      const result = extractItemsByRules('leite, , arroz, , maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should handle empty string', () => {
      const result = extractItemsByRules('');
      expect(result).toEqual([]);
    });

    it('should handle only spaces', () => {
      const result = extractItemsByRules('   ');
      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle single item with quantity', () => {
      const result = extractItemsByRules('2kg batata');
      expect(result).toEqual(['2kg batata']);
    });

    it('should handle items with special characters', () => {
      const result = extractItemsByRules('pão (francês), leite (integral)');
      expect(result).toEqual(['pão (francês)', 'leite (integral)']);
    });

    it('should prioritize lines over commas', () => {
      const result = extractItemsByRules('leite, arroz\nmaçã');
      expect(result).toEqual(['leite, arroz', 'maçã']);
    });

    it('should handle mixed separators', () => {
      const result = extractItemsByRules('leite, arroz e maçã');
      // Vírgula tem prioridade
      expect(result).toEqual(['leite', 'arroz e maçã']);
    });

    it('should handle compound term in unclear context', () => {
      const result = extractItemsByRules('leite coca-cola arroz');
      expect(result).toEqual(['leite coca-cola arroz']);
    });
  });
});
