import { describe, it, expect } from 'vitest';
import { MessageParser } from '../../../src/app/parser/messageParser.js';

describe('MessageParser', () => {
  const parser = new MessageParser();
  const defaultInput = {
    groupId: 'group1',
    userId: 'user1',
  };

  describe('COMMAND_LIST', () => {
    it('should parse "lista" as COMMAND_LIST', () => {
      const result = parser.parse({ ...defaultInput, text: 'lista' });
      expect(result).toEqual({ type: 'COMMAND_LIST' });
    });

    it('should parse "LISTA" (uppercase) as COMMAND_LIST', () => {
      const result = parser.parse({ ...defaultInput, text: 'LISTA' });
      expect(result).toEqual({ type: 'COMMAND_LIST' });
    });

    it('should parse "Lista" (mixed case) as COMMAND_LIST', () => {
      const result = parser.parse({ ...defaultInput, text: 'Lista' });
      expect(result).toEqual({ type: 'COMMAND_LIST' });
    });

    it('should parse "  lista  " (with spaces) as COMMAND_LIST', () => {
      const result = parser.parse({ ...defaultInput, text: '  lista  ' });
      expect(result).toEqual({ type: 'COMMAND_LIST' });
    });
  });

  describe('COMMAND_CLEAR', () => {
    it('should parse "limpar lista" as COMMAND_CLEAR', () => {
      const result = parser.parse({ ...defaultInput, text: 'limpar lista' });
      expect(result).toEqual({ type: 'COMMAND_CLEAR' });
    });

    it('should parse "LIMPAR LISTA" (uppercase) as COMMAND_CLEAR', () => {
      const result = parser.parse({ ...defaultInput, text: 'LIMPAR LISTA' });
      expect(result).toEqual({ type: 'COMMAND_CLEAR' });
    });

    it('should parse "Limpar Lista" (mixed case) as COMMAND_CLEAR', () => {
      const result = parser.parse({ ...defaultInput, text: 'Limpar Lista' });
      expect(result).toEqual({ type: 'COMMAND_CLEAR' });
    });

    it('should parse "  limpar lista  " (with spaces) as COMMAND_CLEAR', () => {
      const result = parser.parse({
        ...defaultInput,
        text: '  limpar lista  ',
      });
      expect(result).toEqual({ type: 'COMMAND_CLEAR' });
    });
  });

  describe('COMMAND_REMOVE', () => {
    it('should parse "- leite" as COMMAND_REMOVE', () => {
      const result = parser.parse({ ...defaultInput, text: '- leite' });
      expect(result).toEqual({ type: 'COMMAND_REMOVE', name: 'leite' });
    });

    it('should parse "-  leite  " (with spaces) as COMMAND_REMOVE', () => {
      const result = parser.parse({ ...defaultInput, text: '-  leite  ' });
      expect(result).toEqual({ type: 'COMMAND_REMOVE', name: 'leite' });
    });

    it('should parse "- Leite Integral" as COMMAND_REMOVE', () => {
      const result = parser.parse({
        ...defaultInput,
        text: '- Leite Integral',
      });
      expect(result).toEqual({
        type: 'COMMAND_REMOVE',
        name: 'Leite Integral',
      });
    });

    it('should parse "-LEITE" (no space) as COMMAND_REMOVE', () => {
      const result = parser.parse({ ...defaultInput, text: '-LEITE' });
      expect(result).toEqual({ type: 'COMMAND_REMOVE', name: 'LEITE' });
    });

    it('should parse "- pão francês" as COMMAND_REMOVE', () => {
      const result = parser.parse({ ...defaultInput, text: '- pão francês' });
      expect(result).toEqual({
        type: 'COMMAND_REMOVE',
        name: 'pão francês',
      });
    });
  });

  describe('COMMAND_BOUGHT', () => {
    it('should parse "✔ leite" as COMMAND_BOUGHT', () => {
      const result = parser.parse({ ...defaultInput, text: '✔ leite' });
      expect(result).toEqual({ type: 'COMMAND_BOUGHT', name: 'leite' });
    });

    it('should parse "check leite" as COMMAND_BOUGHT', () => {
      const result = parser.parse({ ...defaultInput, text: 'check leite' });
      expect(result).toEqual({ type: 'COMMAND_BOUGHT', name: 'leite' });
    });

    it('should parse "CHECK leite" (uppercase) as COMMAND_BOUGHT', () => {
      const result = parser.parse({ ...defaultInput, text: 'CHECK leite' });
      expect(result).toEqual({ type: 'COMMAND_BOUGHT', name: 'leite' });
    });

    it('should parse "Check leite" (mixed case) as COMMAND_BOUGHT', () => {
      const result = parser.parse({ ...defaultInput, text: 'Check leite' });
      expect(result).toEqual({ type: 'COMMAND_BOUGHT', name: 'leite' });
    });

    it('should parse "✔  leite  " (with spaces) as COMMAND_BOUGHT', () => {
      const result = parser.parse({ ...defaultInput, text: '✔  leite  ' });
      expect(result).toEqual({ type: 'COMMAND_BOUGHT', name: 'leite' });
    });

    it('should parse "check Leite Integral" as COMMAND_BOUGHT', () => {
      const result = parser.parse({
        ...defaultInput,
        text: 'check Leite Integral',
      });
      expect(result).toEqual({
        type: 'COMMAND_BOUGHT',
        name: 'Leite Integral',
      });
    });

    it('should parse "✔ pão francês" as COMMAND_BOUGHT', () => {
      const result = parser.parse({ ...defaultInput, text: '✔ pão francês' });
      expect(result).toEqual({
        type: 'COMMAND_BOUGHT',
        name: 'pão francês',
      });
    });
  });

  describe('ITEMS - linha única', () => {
    it('should parse single word as ITEMS', () => {
      const result = parser.parse({ ...defaultInput, text: 'leite' });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual(['leite']);
      expect(result.confidence).toBe(0.7);
    });

    it('should parse short phrase (<= 60 chars) as ITEMS', () => {
      const text = 'leite integral desnatado';
      expect(text.length).toBeLessThanOrEqual(60);
      const result = parser.parse({ ...defaultInput, text });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual([text]);
      expect(result.confidence).toBe(0.7);
    });

    it('should parse exactly 60 chars as ITEMS', () => {
      const text = 'a'.repeat(60);
      expect(text.length).toBe(60);
      const result = parser.parse({ ...defaultInput, text });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual([text]);
      expect(result.confidence).toBe(0.7);
    });

    it('should trim spaces from single item', () => {
      const result = parser.parse({ ...defaultInput, text: '  leite  ' });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual(['leite']);
      expect(result.confidence).toBe(0.7);
    });

    it('should parse item with special characters', () => {
      const result = parser.parse({
        ...defaultInput,
        text: 'pão (francês) - integral',
      });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual([
        'pão (francês) - integral',
      ]);
      expect(result.confidence).toBe(0.7);
    });
  });

  describe('ITEMS - múltiplas linhas', () => {
    it('should parse two lines as ITEMS', () => {
      const result = parser.parse({
        ...defaultInput,
        text: 'leite\npão',
      });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual(['leite', 'pão']);
      expect(result.confidence).toBe(0.7);
    });

    it('should parse three lines as ITEMS', () => {
      const result = parser.parse({
        ...defaultInput,
        text: 'leite\npão\nmanteiga',
      });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual([
        'leite',
        'pão',
        'manteiga',
      ]);
      expect(result.confidence).toBe(0.7);
    });

    it('should trim each line', () => {
      const result = parser.parse({
        ...defaultInput,
        text: '  leite  \n  pão  \n  manteiga  ',
      });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual([
        'leite',
        'pão',
        'manteiga',
      ]);
      expect(result.confidence).toBe(0.7);
    });

    it('should ignore empty lines', () => {
      const result = parser.parse({
        ...defaultInput,
        text: 'leite\n\npão\n\nmanteiga',
      });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual([
        'leite',
        'pão',
        'manteiga',
      ]);
      expect(result.confidence).toBe(0.7);
    });

    it('should handle lines with different lengths', () => {
      const result = parser.parse({
        ...defaultInput,
        text: 'leite\npão integral\nmanteiga',
      });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual([
        'leite',
        'pão integral',
        'manteiga',
      ]);
      expect(result.confidence).toBe(0.7);
    });

    it('should handle lines longer than 60 chars in multi-line', () => {
      const longLine = 'a'.repeat(70);
      const result = parser.parse({
        ...defaultInput,
        text: `leite\n${longLine}\npão`,
      });
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual(['leite', longLine, 'pão']);
      expect(result.confidence).toBe(0.7);
    });
  });

  describe('IGNORE', () => {
    it('should ignore empty string', () => {
      const result = parser.parse({ ...defaultInput, text: '' });
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore only spaces', () => {
      const result = parser.parse({ ...defaultInput, text: '   ' });
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore message longer than 120 chars', () => {
      const longText = 'a'.repeat(121);
      const result = parser.parse({ ...defaultInput, text: longText });
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore exactly 121 chars', () => {
      const longText = 'a'.repeat(121);
      const result = parser.parse({ ...defaultInput, text: longText });
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore single line longer than 60 chars (but <= 120)', () => {
      const longText = 'a'.repeat(61);
      expect(longText.length).toBeGreaterThan(60);
      expect(longText.length).toBeLessThanOrEqual(120);
      const result = parser.parse({ ...defaultInput, text: longText });
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore single line of exactly 61 chars', () => {
      const longText = 'a'.repeat(61);
      const result = parser.parse({ ...defaultInput, text: longText });
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore single line of exactly 120 chars', () => {
      const longText = 'a'.repeat(120);
      const result = parser.parse({ ...defaultInput, text: longText });
      expect(result).toEqual({ type: 'IGNORE' });
    });
  });

  describe('edge cases', () => {
    it('should handle command with extra text after (should not match)', () => {
      const result = parser.parse({
        ...defaultInput,
        text: 'lista de compras',
      });
      // Should not match COMMAND_LIST, should be treated as ITEMS or IGNORE
      expect(result.type).not.toBe('COMMAND_LIST');
    });

    it('should handle "-" alone (should not match COMMAND_REMOVE)', () => {
      const result = parser.parse({ ...defaultInput, text: '-' });
      expect(result.type).not.toBe('COMMAND_REMOVE');
    });

    it('should handle "✔" alone (should not match COMMAND_BOUGHT)', () => {
      const result = parser.parse({ ...defaultInput, text: '✔' });
      expect(result.type).not.toBe('COMMAND_BOUGHT');
    });

    it('should handle "check" alone (should not match COMMAND_BOUGHT)', () => {
      const result = parser.parse({ ...defaultInput, text: 'check' });
      expect(result.type).not.toBe('COMMAND_BOUGHT');
    });

    it('should handle newline-only message', () => {
      const result = parser.parse({ ...defaultInput, text: '\n\n\n' });
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should preserve groupId and userId in input (not used in parsing)', () => {
      const customInput = {
        text: 'leite',
        groupId: 'custom-group',
        userId: 'custom-user',
      };
      const result = parser.parse(customInput);
      expect(result.type).toBe('ITEMS');
      expect(result.items.map((i) => i.name)).toEqual(['leite']);
      expect(result.confidence).toBe(0.7);
    });
  });

  describe('priority order', () => {
    it('should prioritize COMMAND_LIST over ITEMS', () => {
      const result = parser.parse({ ...defaultInput, text: 'lista' });
      expect(result.type).toBe('COMMAND_LIST');
    });

    it('should prioritize COMMAND_CLEAR over ITEMS', () => {
      const result = parser.parse({ ...defaultInput, text: 'limpar lista' });
      expect(result.type).toBe('COMMAND_CLEAR');
    });

    it('should prioritize COMMAND_REMOVE over ITEMS', () => {
      const result = parser.parse({ ...defaultInput, text: '- leite' });
      expect(result.type).toBe('COMMAND_REMOVE');
    });

    it('should prioritize COMMAND_BOUGHT over ITEMS', () => {
      const result = parser.parse({ ...defaultInput, text: 'check leite' });
      expect(result.type).toBe('COMMAND_BOUGHT');
    });
  });
});
