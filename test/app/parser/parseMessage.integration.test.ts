import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseMessage } from '../../../src/app/parser/parseMessage.js';
import type { ParseInput } from '../../../src/app/parser/types.js';
import { extractItemsByLLM } from '../../../src/app/parser/extractItemsByLLM.js';

// Mock do extractItemsByLLM
vi.mock('../../../src/app/parser/extractItemsByLLM.js', () => ({
  extractItemsByLLM: vi.fn(),
}));

describe('parseMessage - integration tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createInput = (text: string): ParseInput => ({
    text,
    groupId: 'test-group',
    userId: 'test-user',
  });

  describe('name registration (precedência antes de comandos e itens)', () => {
    it('should parse "meu nome é João" as NAME_REGISTRATION', async () => {
      const result = await parseMessage(createInput('meu nome é João'));
      expect(result).toEqual({ type: 'NAME_REGISTRATION', name: 'João' });
    });
    it('should parse "cadastrar nome Maria" as NAME_REGISTRATION', async () => {
      const result = await parseMessage(createInput('cadastrar nome Maria'));
      expect(result).toEqual({ type: 'NAME_REGISTRATION', name: 'Maria' });
    });
    it('should parse "sou Pedro" as NAME_REGISTRATION', async () => {
      const result = await parseMessage(createInput('sou Pedro'));
      expect(result).toEqual({ type: 'NAME_REGISTRATION', name: 'Pedro' });
    });
  });

  describe('commands', () => {
    it('should parse "lista" as COMMAND_LIST', async () => {
      const result = await parseMessage(createInput('lista'));
      expect(result).toEqual({ type: 'COMMAND_LIST' });
    });

    it('should parse "limpar lista" as COMMAND_CLEAR', async () => {
      const result = await parseMessage(createInput('limpar lista'));
      expect(result).toEqual({ type: 'COMMAND_CLEAR' });
    });

    it('should parse "- arroz" as COMMAND_REMOVE', async () => {
      const result = await parseMessage(createInput('- arroz'));
      expect(result).toEqual({ type: 'COMMAND_REMOVE', name: 'arroz' });
    });

    it('should parse "✔ leite" as COMMAND_BOUGHT', async () => {
      const result = await parseMessage(createInput('✔ leite'));
      expect(result).toEqual({ type: 'COMMAND_BOUGHT', name: 'leite' });
    });

    it('should parse "check leite" as COMMAND_BOUGHT', async () => {
      const result = await parseMessage(createInput('check leite'));
      expect(result).toEqual({ type: 'COMMAND_BOUGHT', name: 'leite' });
    });
  });

  describe('simple items', () => {
    it('should parse "leite" as ITEMS', async () => {
      const result = await parseMessage(createInput('leite'));
      expect(result).toEqual({ type: 'ITEMS', items: ['leite'] });
    });

    it('should normalize "leite" to lowercase', async () => {
      const result = await parseMessage(createInput('LEITE'));
      expect(result).toEqual({ type: 'ITEMS', items: ['leite'] });
    });
  });

  describe('comma-separated items', () => {
    it('should parse "leite, arroz, feijão" as ITEMS', async () => {
      const result = await parseMessage(createInput('leite, arroz, feijão'));
      expect(result).toEqual({
        type: 'ITEMS',
        items: ['leite', 'arroz', 'feijão'],
      });
    });

    it('should normalize comma-separated items', async () => {
      const result = await parseMessage(createInput('LEITE, ARROZ, FEIJÃO'));
      expect(result).toEqual({
        type: 'ITEMS',
        items: ['leite', 'arroz', 'feijão'],
      });
    });
  });

  describe('multi-line items', () => {
    it('should parse "leite\\narroz\\nfeijão" as ITEMS', async () => {
      const result = await parseMessage(createInput('leite\narroz\nfeijão'));
      expect(result).toEqual({
        type: 'ITEMS',
        items: ['leite', 'arroz', 'feijão'],
      });
    });
  });

  describe('ambiguous items with LLM fallback', () => {
    beforeEach(() => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
    });

    it('should use LLM for "leite maçã coca-cola"', async () => {
      vi.mocked(extractItemsByLLM).mockResolvedValue([
        'leite',
        'maçã',
        'coca-cola',
      ]);

      const result = await parseMessage(createInput('leite maçã coca-cola'));
      expect(result).toEqual({
        type: 'ITEMS',
        items: ['leite', 'maçã', 'coca-cola'],
      });
      expect(extractItemsByLLM).toHaveBeenCalledWith('leite maçã coca-cola');
    });

    it('should parse "acabou o leite e pega pão também" with rules', async () => {
      // A extração por regras divide pelo " e " e retorna 2 itens,
      // então o LLM não é chamado (shouldUseLLM retorna false para 2+ itens)
      const result = await parseMessage(
        createInput('acabou o leite e pega pão também')
      );
      expect(result.type).toBe('ITEMS');
      // Deve usar os itens extraídos por regras
      expect(result.items.length).toBeGreaterThan(0);
      expect(extractItemsByLLM).not.toHaveBeenCalled();
    });

    it('should fallback to ruleItems if LLM fails', async () => {
      vi.mocked(extractItemsByLLM).mockRejectedValue(new Error('API Error'));

      const result = await parseMessage(createInput('leite maçã coca-cola'));
      // Deve retornar o item bruto como fallback
      expect(result.type).toBe('ITEMS');
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should fallback to ruleItems if LLM returns empty', async () => {
      vi.mocked(extractItemsByLLM).mockResolvedValue([]);

      const result = await parseMessage(createInput('leite maçã coca-cola'));
      // Deve retornar o item bruto como fallback
      expect(result.type).toBe('ITEMS');
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('chat messages', () => {
    it('should ignore "vou no mercado agora"', async () => {
      const result = await parseMessage(createInput('vou no mercado agora'));
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore "alguém precisa de algo?"', async () => {
      const result = await parseMessage(createInput('alguém precisa de algo?'));
      expect(result).toEqual({ type: 'IGNORE' });
    });
  });

  describe('normalization', () => {
    it('should apply aliases (coca -> coca-cola)', async () => {
      const result = await parseMessage(createInput('coca'));
      expect(result).toEqual({ type: 'ITEMS', items: ['coca-cola'] });
    });

    it('should normalize duplicates', async () => {
      const result = await parseMessage(createInput('leite, leite, LEITE'));
      expect(result).toEqual({ type: 'ITEMS', items: ['leite'] });
    });

    it('should normalize "papel higienico" to "papel higiênico"', async () => {
      const result = await parseMessage(createInput('papel higienico'));
      expect(result).toEqual({ type: 'ITEMS', items: ['papel higiênico'] });
    });
  });

  describe('edge cases', () => {
    it('should ignore empty message', async () => {
      const result = await parseMessage(createInput(''));
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore message with only spaces', async () => {
      const result = await parseMessage(createInput('   '));
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore message longer than 300 chars', async () => {
      const longMessage = 'a'.repeat(301);
      const result = await parseMessage(createInput(longMessage));
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should ignore message with only emojis', async () => {
      const result = await parseMessage(createInput('😀😀😀'));
      expect(result).toEqual({ type: 'IGNORE' });
    });

    it('should return IGNORE if no items extracted', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      vi.mocked(extractItemsByLLM).mockResolvedValue([]);

      const result = await parseMessage(createInput('vou no mercado'));
      expect(result).toEqual({ type: 'IGNORE' });
    });
  });

  describe('LLM disabled', () => {
    it('should not call LLM when feature flag is disabled', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'false';

      const result = await parseMessage(createInput('leite maçã coca-cola'));
      expect(extractItemsByLLM).not.toHaveBeenCalled();
      expect(result.type).toBe('ITEMS');
    });

    it('should not call LLM when feature flag is not set', async () => {
      delete process.env.ENABLE_LLM_ITEM_EXTRACTION;

      const result = await parseMessage(createInput('leite maçã coca-cola'));
      expect(extractItemsByLLM).not.toHaveBeenCalled();
      expect(result.type).toBe('ITEMS');
    });
  });

  describe('connector-based extraction', () => {
    it('should parse "leite e arroz e maçã"', async () => {
      const result = await parseMessage(createInput('leite e arroz e maçã'));
      expect(result).toEqual({
        type: 'ITEMS',
        items: ['leite', 'arroz', 'maçã'],
      });
    });

    it('should parse "2kg batata e 3 coca"', async () => {
      const result = await parseMessage(createInput('2kg batata e 3 coca'));
      // O alias "coca" só funciona quando o item inteiro é "coca"
      // "3 coca" não será normalizado para "3 coca-cola" automaticamente
      expect(result).toEqual({
        type: 'ITEMS',
        items: ['2kg batata', '3 coca'],
      });
    });
  });
});
