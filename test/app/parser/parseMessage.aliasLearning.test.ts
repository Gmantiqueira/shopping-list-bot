import { describe, it, expect } from 'vitest';
import { parseMessage } from '../../../src/app/parser/parseMessage.js';
import type { ParseInput } from '../../../src/app/parser/types.js';

describe('parseMessage - alias learning integration', () => {
  const createInput = (text: string): ParseInput => ({
    text,
    groupId: 'test-group',
    userId: 'test-user',
  });

  it('should detect "corrigir refri -> coca-cola" as ALIAS_LEARN', async () => {
    const result = await parseMessage(
      createInput('corrigir refri -> coca-cola')
    );
    expect(result).toEqual({
      type: 'ALIAS_LEARN',
      raw: 'refri',
      canonical: 'coca-cola',
    });
  });

  it('should detect "refri = coca-cola" as ALIAS_LEARN', async () => {
    const result = await parseMessage(createInput('refri = coca-cola'));
    expect(result).toEqual({
      type: 'ALIAS_LEARN',
      raw: 'refri',
      canonical: 'coca-cola',
    });
  });

  it('should detect "refri é coca-cola" as ALIAS_LEARN', async () => {
    const result = await parseMessage(createInput('refri é coca-cola'));
    expect(result).toEqual({
      type: 'ALIAS_LEARN',
      raw: 'refri',
      canonical: 'coca-cola',
    });
  });

  it('should detect "refri significa coca-cola" as ALIAS_LEARN', async () => {
    const result = await parseMessage(createInput('refri significa coca-cola'));
    expect(result).toEqual({
      type: 'ALIAS_LEARN',
      raw: 'refri',
      canonical: 'coca-cola',
    });
  });

  it('should normalize alias learning input', async () => {
    const result = await parseMessage(createInput('  REFRI  ->  COCA-COLA  '));
    expect(result).toEqual({
      type: 'ALIAS_LEARN',
      raw: 'refri',
      canonical: 'coca-cola',
    });
  });

  it('should detect alias learning before normal item parsing', async () => {
    // Se fosse item normal, seria parseado como ITEMS
    // Mas como tem padrão de alias learning, deve ser ALIAS_LEARN
    const result = await parseMessage(createInput('refri = coca-cola'));
    expect(result.type).toBe('ALIAS_LEARN');
  });

  it('should not break normal item parsing', async () => {
    const result = await parseMessage(createInput('leite'));
    expect(result.type).toBe('ITEMS');
  });
});
