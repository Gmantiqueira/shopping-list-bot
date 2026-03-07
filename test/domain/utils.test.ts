import { describe, it, expect } from 'vitest';
import { normalizeItemName } from '../../src/domain/utils.js';

describe('normalizeItemName', () => {
  it('should trim whitespace', () => {
    expect(normalizeItemName('  leite  ')).toBe('leite');
  });

  it('should convert to lowercase', () => {
    expect(normalizeItemName('LEITE')).toBe('leite');
    expect(normalizeItemName('LeItE')).toBe('leite');
  });

  it('should remove duplicate spaces', () => {
    expect(normalizeItemName('leite  integral')).toBe('leite integral');
    expect(normalizeItemName('leite    integral')).toBe('leite integral');
    expect(normalizeItemName('leite   integral   desnatado')).toBe(
      'leite integral desnatado'
    );
  });

  it('should handle all transformations together', () => {
    expect(normalizeItemName('  LEITE  INTEGRAL  ')).toBe('leite integral');
    expect(normalizeItemName('  LeItE   InTeGrAl  ')).toBe('leite integral');
  });

  it('should handle single word', () => {
    expect(normalizeItemName('leite')).toBe('leite');
  });

  it('should handle empty string after trim', () => {
    expect(normalizeItemName('   ')).toBe('');
  });
});
