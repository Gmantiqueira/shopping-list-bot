import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractItemsByLLM } from '../../../src/app/parser/extractItemsByLLM.js';
import OpenAI from 'openai';

// Mock do OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe('extractItemsByLLM', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('when LLM is disabled', () => {
    it('should return empty array when ENABLE_LLM_ITEM_EXTRACTION is not true', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'false';
      process.env.OPENAI_API_KEY = 'test-key';

      const result = await extractItemsByLLM('leite maçã coca-cola');
      expect(result).toEqual([]);
    });

    it('should return empty array when ENABLE_LLM_ITEM_EXTRACTION is not set', async () => {
      delete process.env.ENABLE_LLM_ITEM_EXTRACTION;
      process.env.OPENAI_API_KEY = 'test-key';

      const result = await extractItemsByLLM('leite maçã coca-cola');
      expect(result).toEqual([]);
    });
  });

  describe('when API key is missing', () => {
    it('should return empty array when OPENAI_API_KEY is not set', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      delete process.env.OPENAI_API_KEY;

      const result = await extractItemsByLLM('leite maçã coca-cola');
      expect(result).toEqual([]);
    });
  });

  describe('valid responses', () => {
    beforeEach(() => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should parse valid JSON array response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '["leite","maçã","coca-cola"]',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('leite maçã coca-cola');
      expect(result).toEqual(['leite', 'maçã', 'coca-cola']);
    });

    it('should handle response with markdown code blocks', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '```json\n["leite","pão"]\n```',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM(
        'acabou o leite e pega pão também'
      );
      expect(result).toEqual(['leite', 'pão']);
    });

    it('should handle response with quantities', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '["2kg batata","3 coca"]',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('2kg batata e 3 coca');
      expect(result).toEqual(['2kg batata', '3 coca']);
    });

    it('should handle empty array response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '[]',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('vou no mercado agora');
      expect(result).toEqual([]);
    });

    it('should trim and remove empty items', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '["leite","","arroz","  ","maçã"]',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('leite arroz maçã');
      expect(result).toEqual(['leite', 'arroz', 'maçã']);
    });

    it('should limit to 20 items', async () => {
      const manyItems = Array.from({ length: 25 }, (_, i) => `item${i + 1}`);
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(manyItems),
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('many items');
      expect(result).toHaveLength(20);
    });
  });

  describe('invalid responses', () => {
    beforeEach(() => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should return empty array for invalid JSON', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'not valid json',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('leite maçã');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array JSON', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '{"items": ["leite"]}',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('leite');
      expect(result).toEqual([]);
    });

    it('should filter out non-string items', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '["leite", 123, {"item": "arroz"}, "maçã"]',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('leite arroz maçã');
      expect(result).toEqual(['leite', 'maçã']);
    });

    it('should return empty array when response is empty', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('leite');
      expect(result).toEqual([]);
    });

    it('should return empty array when choices is empty', async () => {
      const mockResponse = {
        choices: [],
      };

      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        },
      }));

      const result = await extractItemsByLLM('leite');
      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should return empty array on API error', async () => {
      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      }));

      const result = await extractItemsByLLM('leite');
      expect(result).toEqual([]);
    });

    it('should return empty array on timeout', async () => {
      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockImplementation(() => {
              return new Promise((_, reject) => {
                setTimeout(() => {
                  const error = new Error('Timeout');
                  error.name = 'AbortError';
                  reject(error);
                }, 100);
              });
            }),
          },
        },
      }));

      const result = await extractItemsByLLM('leite');
      expect(result).toEqual([]);
    });
  });

  describe('model configuration', () => {
    it('should use custom model from env', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-4';

      const mockResponse = {
        choices: [
          {
            message: {
              content: '["leite"]',
            },
          },
        ],
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      await extractItemsByLLM('leite');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
        }),
        expect.any(Object)
      );
    });

    it('should use default model when not specified', async () => {
      process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
      process.env.OPENAI_API_KEY = 'test-key';
      delete process.env.OPENAI_MODEL;

      const mockResponse = {
        choices: [
          {
            message: {
              content: '["leite"]',
            },
          },
        ],
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      (OpenAI as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      await extractItemsByLLM('leite');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
        expect.any(Object)
      );
    });
  });
});
