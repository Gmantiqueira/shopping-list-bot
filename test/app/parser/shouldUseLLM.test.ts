import { describe, it, expect } from 'vitest';
import { shouldUseLLM } from '../../../src/app/parser/shouldUseLLM.js';

describe('shouldUseLLM', () => {
  describe('should NOT use LLM', () => {
    it('should return false for multiple lines', () => {
      expect(
        shouldUseLLM('leite\narroz\nmaçã', ['leite', 'arroz', 'maçã'])
      ).toBe(false);
    });

    it('should return false for comma-separated items', () => {
      expect(
        shouldUseLLM('leite, arroz, maçã', ['leite', 'arroz', 'maçã'])
      ).toBe(false);
    });

    it('should return false if ruleItems has 2 or more items', () => {
      expect(shouldUseLLM('leite e arroz', ['leite', 'arroz'])).toBe(false);
    });

    it('should return false if message has less than 3 words', () => {
      expect(shouldUseLLM('leite', ['leite'])).toBe(false);
    });

    it('should return false for single word', () => {
      expect(shouldUseLLM('leite', ['leite'])).toBe(false);
    });

    it('should return false for two words', () => {
      expect(shouldUseLLM('leite integral', ['leite integral'])).toBe(false);
    });
  });

  describe('should use LLM', () => {
    it('should return true if ruleItems has 0 items', () => {
      expect(shouldUseLLM('vou no mercado', [])).toBe(true);
    });

    it('should return true if ruleItems has 1 item but message has 3+ words', () => {
      expect(
        shouldUseLLM('leite maçã coca-cola', ['leite maçã coca-cola'])
      ).toBe(true);
    });

    it('should return true for ambiguous extraction with shopping verbs', () => {
      expect(
        shouldUseLLM('acabou o leite e pega pão também', [
          'acabou o leite e pega pão também',
        ])
      ).toBe(true);
    });

    it('should return true for message with shopping verbs and 1 item extracted', () => {
      expect(
        shouldUseLLM('precisa comprar leite', ['precisa comprar leite'])
      ).toBe(true);
    });

    it('should return true for message with 3+ words and 1 item', () => {
      expect(shouldUseLLM('leite maçã coca', ['leite maçã coca'])).toBe(true);
    });
  });

  describe('examples from requirements', () => {
    it('should return false for "leite, arroz, maçã"', () => {
      expect(
        shouldUseLLM('leite, arroz, maçã', ['leite', 'arroz', 'maçã'])
      ).toBe(false);
    });

    it('should return false for "leite\\narroz\\nmaçã"', () => {
      expect(
        shouldUseLLM('leite\narroz\nmaçã', ['leite', 'arroz', 'maçã'])
      ).toBe(false);
    });

    it('should return true for "leite maçã coca-cola"', () => {
      expect(
        shouldUseLLM('leite maçã coca-cola', ['leite maçã coca-cola'])
      ).toBe(true);
    });

    it('should return true for "acabou o leite e pega pão também"', () => {
      expect(
        shouldUseLLM('acabou o leite e pega pão também', [
          'acabou o leite e pega pão também',
        ])
      ).toBe(true);
    });

    it('should return false for "leite"', () => {
      expect(shouldUseLLM('leite', ['leite'])).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for empty message with empty items', () => {
      expect(shouldUseLLM('', [])).toBe(false);
    });

    it('should return false for message with only spaces', () => {
      expect(shouldUseLLM('   ', [])).toBe(false);
    });

    it('should return true for message with shopping verb and no items extracted', () => {
      expect(shouldUseLLM('precisa comprar algo', [])).toBe(true);
    });

    it('should return false for message with 2 items extracted via connector', () => {
      expect(shouldUseLLM('leite e arroz', ['leite', 'arroz'])).toBe(false);
    });

    it('should return false for message with comma and 1 item (edge case)', () => {
      expect(shouldUseLLM('leite,', ['leite'])).toBe(false);
    });

    it('should return true for complex phrase with shopping verb', () => {
      expect(
        shouldUseLLM('vou comprar leite e depois pegar pão', [
          'vou comprar leite e depois pegar pão',
        ])
      ).toBe(true);
    });

    it('should return false for simple item with 2 words', () => {
      expect(shouldUseLLM('coca cola', ['coca-cola'])).toBe(false);
    });

    it('should return true for 3-word message with 1 item', () => {
      expect(shouldUseLLM('leite arroz feijão', ['leite arroz feijão'])).toBe(
        true
      );
    });
  });
});
