import { describe, it, expect } from 'vitest';
import { normalizeItems } from '../../../src/app/parser/normalizeItems.js';

describe('normalizeItems', () => {
  describe('basic normalization', () => {
    it('should trim items', () => {
      const result = normalizeItems([' leite ']);
      expect(result).toEqual(['leite']);
    });

    it('should convert to lowercase', () => {
      const result = normalizeItems(['LEITE', 'Arroz', 'MANTEIGA']);
      expect(result).toEqual(['leite', 'arroz', 'manteiga']);
    });

    it('should remove duplicate spaces', () => {
      const result = normalizeItems(['leite   integral', 'pão    francês']);
      expect(result).toEqual(['leite integral', 'pão francês']);
    });

    it('should remove trailing punctuation', () => {
      const result = normalizeItems(['leite.', 'arroz,', 'manteiga;']);
      expect(result).toEqual(['leite', 'arroz', 'manteiga']);
    });

    it('should normalize hyphens with spaces', () => {
      const result = normalizeItems(['coca - cola', 'papel - toalha']);
      expect(result).toEqual(['coca-cola', 'papel-toalha']);
    });
  });

  describe('aliases', () => {
    it('should map "coca cola" to "coca-cola"', () => {
      const result = normalizeItems(['coca cola']);
      expect(result).toEqual(['coca-cola']);
    });

    it('should map "coca" to "coca-cola"', () => {
      const result = normalizeItems(['coca']);
      expect(result).toEqual(['coca-cola']);
    });

    it('should map "papel higienico" to "papel higiênico"', () => {
      const result = normalizeItems(['papel higienico']);
      expect(result).toEqual(['papel higiênico']);
    });

    it('should preserve "papel toalha"', () => {
      const result = normalizeItems(['papel toalha']);
      expect(result).toEqual(['papel toalha']);
    });

    it('should preserve "amaciante"', () => {
      const result = normalizeItems(['amaciante']);
      expect(result).toEqual(['amaciante']);
    });

    it('should preserve "detergente"', () => {
      const result = normalizeItems(['detergente']);
      expect(result).toEqual(['detergente']);
    });
  });

  describe('duplicates', () => {
    it('should remove duplicates preserving order', () => {
      const result = normalizeItems(['leite', 'leite', 'LEITE']);
      expect(result).toEqual(['leite']);
    });

    it('should remove duplicates with different casing', () => {
      const result = normalizeItems(['Leite', 'leite', 'LEITE', 'arroz']);
      expect(result).toEqual(['leite', 'arroz']);
    });

    it('should preserve order of first occurrence', () => {
      const result = normalizeItems([
        'leite',
        'arroz',
        'leite',
        'manteiga',
        'arroz',
      ]);
      expect(result).toEqual(['leite', 'arroz', 'manteiga']);
    });
  });

  describe('empty items', () => {
    it('should remove empty items', () => {
      const result = normalizeItems(['leite', '', 'arroz', '   ', 'manteiga']);
      expect(result).toEqual(['leite', 'arroz', 'manteiga']);
    });

    it('should handle array with only empty items', () => {
      const result = normalizeItems(['', '   ', '  ']);
      expect(result).toEqual([]);
    });

    it('should handle empty array', () => {
      const result = normalizeItems([]);
      expect(result).toEqual([]);
    });
  });

  describe('length limit', () => {
    it('should limit items to 80 characters', () => {
      const longItem = 'a'.repeat(100);
      const result = normalizeItems([longItem]);
      expect(result[0].length).toBeLessThanOrEqual(80);
    });

    it('should preserve items under 80 characters', () => {
      const item = 'a'.repeat(50);
      const result = normalizeItems([item]);
      expect(result[0].length).toBe(50);
    });

    it('should trim after truncating', () => {
      const longItem = 'a'.repeat(100) + '   ';
      const result = normalizeItems([longItem]);
      expect(result[0].length).toBeLessThanOrEqual(80);
      expect(result[0]).not.toMatch(/\s+$/);
    });
  });

  describe('edge cases', () => {
    it('should handle items with multiple spaces', () => {
      const result = normalizeItems(['leite    integral    desnatado']);
      expect(result).toEqual(['leite integral desnatado']);
    });

    it('should handle items with mixed punctuation', () => {
      const result = normalizeItems(['leite...', 'arroz,,,', 'manteiga!!!']);
      expect(result).toEqual(['leite', 'arroz', 'manteiga']);
    });

    it('should handle items with hyphens in middle', () => {
      const result = normalizeItems(['coca-cola', 'papel-toalha']);
      expect(result).toEqual(['coca-cola', 'papel-toalha']);
    });

    it('should handle items with leading punctuation', () => {
      const result = normalizeItems(['.leite', ',arroz']);
      expect(result).toEqual(['leite', 'arroz']);
    });

    it('should handle complex normalization', () => {
      const result = normalizeItems([
        '  COCA COLA  ',
        'coca',
        '  Leite   Integral  ',
        'leite',
        'leite',
      ]);
      // "leite" e "leite integral" são itens diferentes, então ambos aparecem
      expect(result).toContain('coca-cola');
      expect(result).toContain('leite integral');
      expect(result).toContain('leite');
    });

    it('should handle items with quantities', () => {
      const result = normalizeItems(['2kg batata', '3  coca', '1kg  açúcar']);
      // "3 coca" não deve virar "3 coca-cola" porque "coca" não é o item inteiro
      expect(result).toEqual(['2kg batata', '3 coca', '1kg açúcar']);
    });

    it('should handle items with special characters', () => {
      const result = normalizeItems(['pão (francês)', 'leite (integral)']);
      expect(result).toEqual(['pão (francês)', 'leite (integral)']);
    });
  });

  describe('alias edge cases', () => {
    it('should handle aliases with different spacing', () => {
      const result = normalizeItems(['coca  cola', 'coca-cola']);
      expect(result).toEqual(['coca-cola']);
    });

    it('should handle case-insensitive aliases', () => {
      const result = normalizeItems(['COCA', 'Coca', 'coca']);
      expect(result).toEqual(['coca-cola']);
    });
  });
});
