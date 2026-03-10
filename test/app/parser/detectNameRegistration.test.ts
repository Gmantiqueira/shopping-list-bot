import { describe, it, expect } from 'vitest';
import { detectNameRegistration } from '../../../src/app/parser/detectNameRegistration.js';

describe('detectNameRegistration', () => {
  describe('aceitos', () => {
    it('"meu nome é João"', () => {
      expect(detectNameRegistration('meu nome é João')).toBe('João');
    });
    it('"meu nome é Maria Silva"', () => {
      expect(detectNameRegistration('meu nome é Maria Silva')).toBe(
        'Maria Silva'
      );
    });
    it('"cadastrar nome Pedro"', () => {
      expect(detectNameRegistration('cadastrar nome Pedro')).toBe('Pedro');
    });
    it('"cadastrar nome Ana Costa"', () => {
      expect(detectNameRegistration('cadastrar nome Ana Costa')).toBe(
        'Ana Costa'
      );
    });
    it('"sou João"', () => {
      expect(detectNameRegistration('sou João')).toBe('João');
    });
    it('"sou o João"', () => {
      expect(detectNameRegistration('sou o João')).toBe('o João');
    });
    it('aceita trim', () => {
      expect(detectNameRegistration('  meu nome é   José  ')).toBe('José');
    });
    it('aceita nome com 2 caracteres', () => {
      expect(detectNameRegistration('meu nome é Li')).toBe('Li');
    });
  });

  describe('não aceitos (seguem fluxo normal)', () => {
    it('mensagem vazia após padrão', () => {
      expect(detectNameRegistration('meu nome é')).toBeNull();
    });
    it('nome com 1 caractere', () => {
      expect(detectNameRegistration('meu nome é X')).toBeNull();
    });
    it('nome só números', () => {
      expect(detectNameRegistration('meu nome é 123')).toBeNull();
    });
    it('lista de compras não é cadastro', () => {
      expect(detectNameRegistration('leite e pão')).toBeNull();
    });
    it('comando lista', () => {
      expect(detectNameRegistration('lista')).toBeNull();
    });
    it('alias "refri é coca" não é nome', () => {
      expect(detectNameRegistration('refri é coca')).toBeNull();
    });
    it('"sou" sozinho não é cadastro', () => {
      expect(detectNameRegistration('sou')).toBeNull();
    });
    it('nome longo demais (>100)', () => {
      expect(
        detectNameRegistration('meu nome é ' + 'a'.repeat(101))
      ).toBeNull();
    });
  });
});
