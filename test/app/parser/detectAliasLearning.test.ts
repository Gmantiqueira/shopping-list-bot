import { describe, it, expect } from 'vitest';
import { detectAliasLearning } from '../../../src/app/parser/detectAliasLearning.js';

describe('detectAliasLearning', () => {
  describe('valid patterns', () => {
    it('should detect "corrigir refri -> coca-cola"', () => {
      const result = detectAliasLearning('corrigir refri -> coca-cola');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });

    it('should detect "refri = coca-cola"', () => {
      const result = detectAliasLearning('refri = coca-cola');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });

    it('should detect "refri é coca-cola"', () => {
      const result = detectAliasLearning('refri é coca-cola');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });

    it('should detect "refri significa coca-cola"', () => {
      const result = detectAliasLearning('refri significa coca-cola');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });

    it('should normalize with trim and lowercase', () => {
      const result = detectAliasLearning('  REFRI  ->  COCA-COLA  ');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });

    it('should normalize multiple spaces', () => {
      const result = detectAliasLearning('refri   =   coca-cola');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });

    it('should handle mixed case', () => {
      const result = detectAliasLearning('Refri É Coca-Cola');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });
  });

  describe('invalid patterns', () => {
    it('should return null for empty raw', () => {
      const result = detectAliasLearning(' -> coca-cola');
      expect(result).toBeNull();
    });

    it('should return null for empty canonical', () => {
      const result = detectAliasLearning('refri -> ');
      expect(result).toBeNull();
    });

    it('should return null when raw and canonical are equal', () => {
      const result = detectAliasLearning('refri -> refri');
      expect(result).toBeNull();
    });

    it('should return null when raw and canonical are equal after normalization', () => {
      const result = detectAliasLearning('REFRI -> refri');
      expect(result).toBeNull();
    });

    it('should return null when raw exceeds 80 characters', () => {
      const longRaw = 'a'.repeat(81);
      const result = detectAliasLearning(`${longRaw} -> coca-cola`);
      expect(result).toBeNull();
    });

    it('should return null when canonical exceeds 80 characters', () => {
      const longCanonical = 'a'.repeat(81);
      const result = detectAliasLearning(`refri -> ${longCanonical}`);
      expect(result).toBeNull();
    });

    it('should accept exactly 80 characters', () => {
      const longRaw = 'a'.repeat(80);
      const result = detectAliasLearning(`${longRaw} -> coca-cola`);
      expect(result).not.toBeNull();
      expect(result?.raw).toBe(longRaw);
    });

    it('should return null for non-matching patterns', () => {
      const result = detectAliasLearning('refri coca-cola');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = detectAliasLearning('');
      expect(result).toBeNull();
    });

    it('should return null for only spaces', () => {
      const result = detectAliasLearning('   ');
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in raw', () => {
      const result = detectAliasLearning('refri-2l -> coca-cola 2l');
      expect(result).toEqual({
        raw: 'refri-2l',
        canonical: 'coca-cola 2l',
      });
    });

    it('should handle multiple words', () => {
      const result = detectAliasLearning('papel higienico -> papel higiênico');
      expect(result).toEqual({
        raw: 'papel higienico',
        canonical: 'papel higiênico',
      });
    });

    it('should handle pattern with extra spaces around arrow', () => {
      const result = detectAliasLearning('refri  ->  coca-cola');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });

    it('should handle pattern with no spaces around equals', () => {
      const result = detectAliasLearning('refri=coca-cola');
      expect(result).toEqual({
        raw: 'refri',
        canonical: 'coca-cola',
      });
    });

    it('should handle "corrigir" with equals sign', () => {
      // "corrigir" pattern should match first, but "=" pattern will match
      // since "corrigir" pattern only matches "->"
      const result = detectAliasLearning('corrigir refri = coca-cola');
      // O padrão "=" vai capturar "corrigir refri" como raw
      expect(result).not.toBeNull();
      expect(result?.canonical).toBe('coca-cola');
    });
  });
});
