import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseMessage } from '../../../src/app/parser/parseMessage.js';
import type { ParseInput } from '../../../src/app/parser/types.js';
import { extractItemsByLLM } from '../../../src/app/parser/extractItemsByLLM.js';

// Mock do extractItemsByLLM
vi.mock('../../../src/app/parser/extractItemsByLLM.js', () => ({
  extractItemsByLLM: vi.fn(),
}));

describe('Real-world WhatsApp shopping messages', () => {
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

  describe('Messages that SHOULD become items', () => {
    it('should parse "leite maçã coca-cola"', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      vi.mocked(extractItemsByLLM).mockResolvedValue([
        'leite',
        'maçã',
        'coca-cola',
      ]);

      const result = await parseMessage(createInput('leite maçã coca-cola'));
      expect(result.type).toBe('ITEMS');
      expect(result.items).toContain('leite');
      expect(result.items).toContain('maçã');
      expect(result.items).toContain('coca-cola');
    });

    it('should parse "acabou o leite e pega pão também"', async () => {
      const result = await parseMessage(
        createInput('acabou o leite e pega pão também')
      );
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "compra arroz, feijão e macarrão"', async () => {
      const result = await parseMessage(
        createInput('compra arroz, feijão e macarrão')
      );
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "2 coca e 1 detergente"', async () => {
      const result = await parseMessage(createInput('2 coca e 1 detergente'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "precisa comprar papel higienico"', async () => {
      const result = await parseMessage(
        createInput('precisa comprar papel higienico')
      );
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "traz banana e maçã"', async () => {
      const result = await parseMessage(createInput('traz banana e maçã'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "café"', async () => {
      const result = await parseMessage(createInput('café'));
      expect(result.type).toBe('ITEMS');
      expect(result.items).toContain('café');
    });

    it('should parse "ração do gato"', async () => {
      const result = await parseMessage(createInput('ração do gato'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "leite\narroz\nfeijão" (multi-line)', async () => {
      const result = await parseMessage(createInput('leite\narroz\nfeijão'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBe(3);
    });

    it('should parse "pão de açúcar"', async () => {
      const result = await parseMessage(createInput('pão de açúcar'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "água mineral"', async () => {
      const result = await parseMessage(createInput('água mineral'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "3kg de açúcar"', async () => {
      const result = await parseMessage(createInput('3kg de açúcar'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "manteiga e margarina"', async () => {
      const result = await parseMessage(createInput('manteiga e margarina'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "fralda p"', async () => {
      const result = await parseMessage(createInput('fralda p'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "sabonete + shampoo"', async () => {
      const result = await parseMessage(createInput('sabonete + shampoo'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "pega leite e pão"', async () => {
      const result = await parseMessage(createInput('pega leite e pão'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "comprar frango e batata"', async () => {
      const result = await parseMessage(createInput('comprar frango e batata'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('Messages that SHOULD be ignored', () => {
    it('should ignore "vou no mercado agora"', async () => {
      const result = await parseMessage(createInput('vou no mercado agora'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "to indo no mercado"', async () => {
      const result = await parseMessage(createInput('to indo no mercado'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "alguém precisa de algo?"', async () => {
      const result = await parseMessage(createInput('alguém precisa de algo?'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "quem vai comprar?"', async () => {
      const result = await parseMessage(createInput('quem vai comprar?'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "já compraram leite?"', async () => {
      const result = await parseMessage(createInput('já compraram leite?'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "quer que eu compre alguma coisa?"', async () => {
      const result = await parseMessage(
        createInput('quer que eu compre alguma coisa?')
      );
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "bom dia"', async () => {
      const result = await parseMessage(createInput('bom dia'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "kkkk"', async () => {
      const result = await parseMessage(createInput('kkkk'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "obrigado"', async () => {
      const result = await parseMessage(createInput('obrigado'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "valeu"', async () => {
      const result = await parseMessage(createInput('valeu'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "ok"', async () => {
      const result = await parseMessage(createInput('ok'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "tá bom"', async () => {
      const result = await parseMessage(createInput('tá bom'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "vou passar no mercado"', async () => {
      const result = await parseMessage(createInput('vou passar no mercado'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "alguem quer algo do mercado?"', async () => {
      const result = await parseMessage(
        createInput('alguem quer algo do mercado?')
      );
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "já compraram?"', async () => {
      const result = await parseMessage(createInput('já compraram?'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "preciso de ajuda"', async () => {
      const result = await parseMessage(createInput('preciso de ajuda'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "qual mercado?"', async () => {
      const result = await parseMessage(createInput('qual mercado?'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "quando você vai?"', async () => {
      const result = await parseMessage(createInput('quando você vai?'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "beleza"', async () => {
      const result = await parseMessage(createInput('beleza'));
      expect(result.type).toBe('IGNORE');
    });

    it('should ignore "tchau"', async () => {
      const result = await parseMessage(createInput('tchau'));
      expect(result.type).toBe('IGNORE');
    });
  });

  describe('Edge cases and variations', () => {
    it('should parse "leite,arroz,feijão" (no spaces)', async () => {
      const result = await parseMessage(createInput('leite,arroz,feijão'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "LEITE ARROZ FEIJÃO" (uppercase)', async () => {
      const result = await parseMessage(createInput('LEITE ARROZ FEIJÃO'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "leite  arroz  feijão" (extra spaces)', async () => {
      const result = await parseMessage(createInput('leite  arroz  feijão'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should parse "coca cola" and normalize to "coca-cola"', async () => {
      const result = await parseMessage(createInput('coca cola'));
      expect(result.type).toBe('ITEMS');
      expect(result.items).toContain('coca-cola');
    });

    it('should parse "coca" and normalize to "coca-cola"', async () => {
      const result = await parseMessage(createInput('coca'));
      expect(result.type).toBe('ITEMS');
      expect(result.items).toContain('coca-cola');
    });

    it('should handle "preciso de leite"', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      vi.mocked(extractItemsByLLM).mockResolvedValue(['leite']);

      const result = await parseMessage(createInput('preciso de leite'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should handle "acabou o leite"', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      vi.mocked(extractItemsByLLM).mockResolvedValue(['leite']);

      const result = await parseMessage(createInput('acabou o leite'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should handle "trazer pão"', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      vi.mocked(extractItemsByLLM).mockResolvedValue(['pão']);

      const result = await parseMessage(createInput('trazer pão'));
      expect(result.type).toBe('ITEMS');
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
