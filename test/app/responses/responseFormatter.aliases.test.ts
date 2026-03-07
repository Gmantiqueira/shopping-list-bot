import { describe, it, expect } from 'vitest';
import { ResponseFormatter } from '../../../src/app/responses/responseFormatter.js';

describe('ResponseFormatter - formatAliasesList', () => {
  const formatter = new ResponseFormatter();

  it('should return empty message when no aliases', () => {
    const result = formatter.formatAliasesList([]);
    expect(result).toBe('Ainda não aprendi nenhum apelido neste grupo.');
  });

  it('should format single alias', () => {
    const result = formatter.formatAliasesList([
      { rawTerm: 'refri', canonicalItem: 'coca-cola' },
    ]);
    expect(result).toBe('Vocabulário aprendido:\nrefri → coca-cola');
  });

  it('should format multiple aliases', () => {
    const result = formatter.formatAliasesList([
      { rawTerm: 'refri', canonicalItem: 'coca-cola' },
      { rawTerm: 'papel', canonicalItem: 'papel higiênico' },
    ]);
    expect(result).toBe(
      'Vocabulário aprendido:\nrefri → coca-cola\npapel → papel higiênico'
    );
  });

  it('should limit to 20 aliases', () => {
    const aliases = Array.from({ length: 25 }, (_, i) => ({
      rawTerm: `term${i}`,
      canonicalItem: `canonical${i}`,
    }));

    const result = formatter.formatAliasesList(aliases);

    expect(result).toContain('Vocabulário aprendido:');
    expect(result).toContain('term0 → canonical0');
    expect(result).toContain('term19 → canonical19');
    expect(result).not.toContain('term20 → canonical20');
    expect(result).toContain('... e mais 5 apelido(s)');
  });

  it('should format exactly 20 aliases without truncation message', () => {
    const aliases = Array.from({ length: 20 }, (_, i) => ({
      rawTerm: `term${i}`,
      canonicalItem: `canonical${i}`,
    }));

    const result = formatter.formatAliasesList(aliases);

    expect(result).toContain('Vocabulário aprendido:');
    expect(result).toContain('term0 → canonical0');
    expect(result).toContain('term19 → canonical19');
    expect(result).not.toContain('... e mais');
  });
});
