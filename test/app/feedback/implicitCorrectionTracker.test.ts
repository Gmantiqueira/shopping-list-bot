import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImplicitCorrectionTracker } from '../../../src/app/feedback/implicitCorrectionTracker.js';

describe('ImplicitCorrectionTracker', () => {
  let tracker: ImplicitCorrectionTracker;

  beforeEach(() => {
    tracker = new ImplicitCorrectionTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should record removal', () => {
    tracker.recordRemoval('group1', 'user1', 'papel');
    const removal = tracker.getRecentRemoval('group1', 'user1');
    expect(removal).not.toBeNull();
    expect(removal?.removedItem).toBe('papel');
  });

  it('should return null when no removal recorded', () => {
    const removal = tracker.getRecentRemoval('group1', 'user1');
    expect(removal).toBeNull();
  });

  it('should return null after TTL expires', () => {
    tracker.recordRemoval('group1', 'user1', 'papel');

    // Avança 2 minutos e 1 segundo
    vi.advanceTimersByTime(2 * 60 * 1000 + 1000);

    const removal = tracker.getRecentRemoval('group1', 'user1');
    expect(removal).toBeNull();
  });

  it('should return removal within TTL', () => {
    tracker.recordRemoval('group1', 'user1', 'papel');

    // Avança 1 minuto (ainda dentro do TTL)
    vi.advanceTimersByTime(60 * 1000);

    const removal = tracker.getRecentRemoval('group1', 'user1');
    expect(removal).not.toBeNull();
    expect(removal?.removedItem).toBe('papel');
  });

  it('should isolate by groupId and userId', () => {
    tracker.recordRemoval('group1', 'user1', 'papel');
    tracker.recordRemoval('group2', 'user1', 'leite');
    tracker.recordRemoval('group1', 'user2', 'arroz');

    expect(tracker.getRecentRemoval('group1', 'user1')?.removedItem).toBe(
      'papel'
    );
    expect(tracker.getRecentRemoval('group2', 'user1')?.removedItem).toBe(
      'leite'
    );
    expect(tracker.getRecentRemoval('group1', 'user2')?.removedItem).toBe(
      'arroz'
    );
  });

  it('should clear removal after processing', () => {
    tracker.recordRemoval('group1', 'user1', 'papel');
    tracker.clearRemoval('group1', 'user1');

    const removal = tracker.getRecentRemoval('group1', 'user1');
    expect(removal).toBeNull();
  });

  it('should overwrite previous removal for same group/user', () => {
    tracker.recordRemoval('group1', 'user1', 'papel');
    tracker.recordRemoval('group1', 'user1', 'leite');

    const removal = tracker.getRecentRemoval('group1', 'user1');
    expect(removal?.removedItem).toBe('leite');
  });
});
