import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfirmationManager } from '../../../src/app/responses/confirmationManager.js';

describe('ConfirmationManager', () => {
  let manager: ConfirmationManager;

  beforeEach(() => {
    manager = new ConfirmationManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('requestClear', () => {
    it('should create pending confirmation', () => {
      manager.requestClear('group1', 'user1');
      expect(manager.hasPending('group1', 'user1')).toBe(true);
    });

    it('should isolate by group and user', () => {
      manager.requestClear('group1', 'user1');
      manager.requestClear('group2', 'user1');
      manager.requestClear('group1', 'user2');

      expect(manager.hasPending('group1', 'user1')).toBe(true);
      expect(manager.hasPending('group2', 'user1')).toBe(true);
      expect(manager.hasPending('group1', 'user2')).toBe(true);
    });
  });

  describe('checkAndConsume', () => {
    it('should return CLEAR on SIM confirmation', () => {
      manager.requestClear('group1', 'user1');
      const result = manager.checkAndConsume('group1', 'user1', 'SIM');
      expect(result).toBe('CLEAR');
      expect(manager.hasPending('group1', 'user1')).toBe(false);
    });

    it('should return CLEAR on lowercase sim', () => {
      manager.requestClear('group1', 'user1');
      const result = manager.checkAndConsume('group1', 'user1', 'sim');
      expect(result).toBe('CLEAR');
    });

    it('should return CLEAR on mixed case sim', () => {
      manager.requestClear('group1', 'user1');
      const result = manager.checkAndConsume('group1', 'user1', 'SiM');
      expect(result).toBe('CLEAR');
    });

    it('should return null if no pending confirmation', () => {
      const result = manager.checkAndConsume('group1', 'user1', 'SIM');
      expect(result).toBeNull();
    });

    it('should return null if wrong user', () => {
      manager.requestClear('group1', 'user1');
      const result = manager.checkAndConsume('group1', 'user2', 'SIM');
      expect(result).toBeNull();
      expect(manager.hasPending('group1', 'user1')).toBe(true);
    });

    it('should return null if wrong group', () => {
      manager.requestClear('group1', 'user1');
      const result = manager.checkAndConsume('group2', 'user1', 'SIM');
      expect(result).toBeNull();
      expect(manager.hasPending('group1', 'user1')).toBe(true);
    });

    it('should return null if not SIM', () => {
      manager.requestClear('group1', 'user1');
      const result = manager.checkAndConsume('group1', 'user1', 'não');
      expect(result).toBeNull();
      expect(manager.hasPending('group1', 'user1')).toBe(true);
    });

    it('should return null if confirmation expired', () => {
      manager.requestClear('group1', 'user1');

      // Avança 31 segundos (mais que o timeout de 30s)
      vi.advanceTimersByTime(31000);

      const result = manager.checkAndConsume('group1', 'user1', 'SIM');
      expect(result).toBeNull();
      expect(manager.hasPending('group1', 'user1')).toBe(false);
    });

    it('should consume confirmation only once', () => {
      manager.requestClear('group1', 'user1');

      const result1 = manager.checkAndConsume('group1', 'user1', 'SIM');
      expect(result1).toBe('CLEAR');

      const result2 = manager.checkAndConsume('group1', 'user1', 'SIM');
      expect(result2).toBeNull();
    });

    it('should handle SIM with spaces', () => {
      manager.requestClear('group1', 'user1');
      const result = manager.checkAndConsume('group1', 'user1', '  SIM  ');
      expect(result).toBe('CLEAR');
    });
  });

  describe('hasPending', () => {
    it('should return false if no confirmation', () => {
      expect(manager.hasPending('group1', 'user1')).toBe(false);
    });

    it('should return true if confirmation exists', () => {
      manager.requestClear('group1', 'user1');
      expect(manager.hasPending('group1', 'user1')).toBe(true);
    });

    it('should return false if confirmation expired', () => {
      manager.requestClear('group1', 'user1');
      vi.advanceTimersByTime(31000);
      expect(manager.hasPending('group1', 'user1')).toBe(false);
    });

    it('should return true if confirmation not expired', () => {
      manager.requestClear('group1', 'user1');
      vi.advanceTimersByTime(29000); // 29 segundos, ainda válido
      expect(manager.hasPending('group1', 'user1')).toBe(true);
    });
  });
});
