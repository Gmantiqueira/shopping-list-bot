import { describe, it, expect } from 'vitest';
import { parseMessage } from '../../../src/app/parser/parseMessage.js';
import type { ParseInput } from '../../../src/app/parser/types.js';

describe('parseMessage - COMMAND_LIST_ALIASES', () => {
  const createInput = (text: string): ParseInput => ({
    text,
    groupId: 'test-group',
    userId: 'test-user',
  });

  it('should detect "aliases" command', async () => {
    const result = await parseMessage(createInput('aliases'));
    expect(result.type).toBe('COMMAND_LIST_ALIASES');
  });

  it('should detect "vocabulário" command', async () => {
    const result = await parseMessage(createInput('vocabulário'));
    expect(result.type).toBe('COMMAND_LIST_ALIASES');
  });

  it('should detect "vocabulario" command (without accent)', async () => {
    const result = await parseMessage(createInput('vocabulario'));
    expect(result.type).toBe('COMMAND_LIST_ALIASES');
  });

  it('should be case insensitive', async () => {
    expect((await parseMessage(createInput('ALIASES'))).type).toBe(
      'COMMAND_LIST_ALIASES'
    );
    expect((await parseMessage(createInput('Vocabulário'))).type).toBe(
      'COMMAND_LIST_ALIASES'
    );
  });

  it('should trim whitespace', async () => {
    const result = await parseMessage(createInput('  aliases  '));
    expect(result.type).toBe('COMMAND_LIST_ALIASES');
  });

  it('should not detect command with extra text', async () => {
    const result1 = await parseMessage(createInput('aliases do grupo'));
    expect(result1.type).not.toBe('COMMAND_LIST_ALIASES');

    const result2 = await parseMessage(createInput('mostrar aliases'));
    expect(result2.type).not.toBe('COMMAND_LIST_ALIASES');
  });
});
