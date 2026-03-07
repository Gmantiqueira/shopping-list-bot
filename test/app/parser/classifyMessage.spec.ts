import { describe, it, expect } from 'vitest';
import { classifyMessage } from '../../../src/app/parser/classifyMessage.js';

describe('classifyMessage', () => {
  describe('COMMAND', () => {
    it('should classify "lista" as COMMAND', () => {
      expect(classifyMessage('lista')).toBe('COMMAND');
    });

    it('should classify "LISTA" (uppercase) as COMMAND', () => {
      expect(classifyMessage('LISTA')).toBe('COMMAND');
    });

    it('should classify "limpar lista" as COMMAND', () => {
      expect(classifyMessage('limpar lista')).toBe('COMMAND');
    });

    it('should classify "- arroz" as COMMAND', () => {
      expect(classifyMessage('- arroz')).toBe('COMMAND');
    });

    it('should classify "-arroz" (no space) as COMMAND', () => {
      expect(classifyMessage('-arroz')).toBe('COMMAND');
    });

    it('should classify "✔ leite" as COMMAND', () => {
      expect(classifyMessage('✔ leite')).toBe('COMMAND');
    });

    it('should classify "check leite" as COMMAND', () => {
      expect(classifyMessage('check leite')).toBe('COMMAND');
    });

    it('should classify "CHECK leite" (uppercase) as COMMAND', () => {
      expect(classifyMessage('CHECK leite')).toBe('COMMAND');
    });
  });

  describe('CHAT', () => {
    it('should classify "vou no mercado agora" as CHAT', () => {
      expect(classifyMessage('vou no mercado agora')).toBe('CHAT');
    });

    it('should classify "to indo no mercado" as CHAT', () => {
      expect(classifyMessage('to indo no mercado')).toBe('CHAT');
    });

    it('should classify "alguém precisa de algo?" as CHAT', () => {
      expect(classifyMessage('alguém precisa de algo?')).toBe('CHAT');
    });

    it('should classify "alguem precisa de algo?" as CHAT', () => {
      expect(classifyMessage('alguem precisa de algo?')).toBe('CHAT');
    });

    it('should classify "quem vai comprar?" as CHAT', () => {
      expect(classifyMessage('quem vai comprar?')).toBe('CHAT');
    });

    it('should classify "já compraram?" as CHAT', () => {
      expect(classifyMessage('já compraram?')).toBe('CHAT');
    });

    it('should classify "ja compraram?" as CHAT', () => {
      expect(classifyMessage('ja compraram?')).toBe('CHAT');
    });

    it('should classify "quer que eu compre alguma coisa?" as CHAT', () => {
      expect(classifyMessage('quer que eu compre alguma coisa?')).toBe('CHAT');
    });

    it('should classify "vou passar no mercado" as CHAT', () => {
      expect(classifyMessage('vou passar no mercado')).toBe('CHAT');
    });

    it('should classify "alguem quer algo do mercado?" as CHAT', () => {
      expect(classifyMessage('alguem quer algo do mercado?')).toBe('CHAT');
    });

    it('should classify "alguém quer algo do mercado?" as CHAT', () => {
      expect(classifyMessage('alguém quer algo do mercado?')).toBe('CHAT');
    });
  });

  describe('SHOPPING_CANDIDATE', () => {
    it('should classify "leite" (short item) as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('leite')).toBe('SHOPPING_CANDIDATE');
    });

    it('should classify "leite, arroz, feijão" (with commas) as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('leite, arroz, feijão')).toBe(
        'SHOPPING_CANDIDATE'
      );
    });

    it('should classify multi-line message as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('leite\narroz\nfeijão')).toBe(
        'SHOPPING_CANDIDATE'
      );
    });

    it('should classify "acabou o leite e pega pão" (with shopping verbs) as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('acabou o leite e pega pão')).toBe(
        'SHOPPING_CANDIDATE'
      );
    });

    it('should classify "precisa comprar leite" (with shopping verb) as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('precisa comprar leite')).toBe(
        'SHOPPING_CANDIDATE'
      );
    });

    it('should classify "preciso de arroz" (with shopping verb) as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('preciso de arroz')).toBe('SHOPPING_CANDIDATE');
    });

    it('should classify "traz pão e leite" (with shopping verb and connector) as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('traz pão e leite')).toBe('SHOPPING_CANDIDATE');
    });

    it('should classify "leite e pão" (with connector) as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('leite e pão')).toBe('SHOPPING_CANDIDATE');
    });

    it('should classify "leite, e pão" (with comma and connector) as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('leite, e pão')).toBe('SHOPPING_CANDIDATE');
    });

    it('should classify short item name as SHOPPING_CANDIDATE', () => {
      expect(classifyMessage('pão')).toBe('SHOPPING_CANDIDATE');
    });
  });

  describe('IGNORE', () => {
    it('should classify empty string as IGNORE', () => {
      expect(classifyMessage('')).toBe('IGNORE');
    });

    it('should classify only spaces as IGNORE', () => {
      expect(classifyMessage('   ')).toBe('IGNORE');
    });

    it('should classify message longer than 300 chars as IGNORE', () => {
      const longMessage = 'a'.repeat(301);
      expect(classifyMessage(longMessage)).toBe('IGNORE');
    });

    it('should classify message with exactly 300 chars as not IGNORE', () => {
      const message = 'a'.repeat(300);
      expect(classifyMessage(message)).not.toBe('IGNORE');
    });

    it('should classify message with only emojis as IGNORE', () => {
      expect(classifyMessage('😀😀😀')).toBe('IGNORE');
    });

    it('should classify message with emojis and spaces as IGNORE', () => {
      expect(classifyMessage('😀 😀 😀')).toBe('IGNORE');
    });

    it('should not classify message with text and emoji as IGNORE', () => {
      expect(classifyMessage('leite 😀')).not.toBe('IGNORE');
    });
  });

  describe('edge cases', () => {
    it('should handle mixed case commands', () => {
      expect(classifyMessage('LiStA')).toBe('COMMAND');
    });

    it('should handle commands with extra spaces', () => {
      expect(classifyMessage('  lista  ')).toBe('COMMAND');
    });

    it('should handle shopping candidate with multiple shopping verbs', () => {
      expect(classifyMessage('precisa comprar e pegar leite')).toBe(
        'SHOPPING_CANDIDATE'
      );
    });

    it('should prioritize COMMAND over other classifications', () => {
      // Mesmo que tenha verbo de compra, se começar com "- " é comando
      expect(classifyMessage('- precisa comprar leite')).toBe('COMMAND');
    });

    it('should prioritize CHAT over SHOPPING_CANDIDATE for chat patterns', () => {
      expect(classifyMessage('vou no mercado agora')).toBe('CHAT');
    });

    it('should handle long shopping list', () => {
      const longList = Array.from(
        { length: 20 },
        (_, i) => `item${i + 1}`
      ).join(', ');
      expect(classifyMessage(longList)).toBe('SHOPPING_CANDIDATE');
    });

    it('should handle message with newlines and commas', () => {
      expect(classifyMessage('leite,\narroz,\nfeijão')).toBe(
        'SHOPPING_CANDIDATE'
      );
    });
  });
});
