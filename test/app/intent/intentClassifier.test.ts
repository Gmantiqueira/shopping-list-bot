import { describe, it, expect } from 'vitest';
import { classifyIntent } from '../../../src/app/intent/intentClassifier.js';

describe('intentClassifier', () => {
  describe('ADD_ITEM', () => {
    it('should classify "2 arroz" as ADD_ITEM', () => {
      expect(classifyIntent('2 arroz')).toEqual({ intent: 'ADD_ITEM' });
    });

    it('should classify "banana" as ADD_ITEM', () => {
      expect(classifyIntent('banana')).toEqual({ intent: 'ADD_ITEM' });
    });

    it('should classify "leite e pão" as ADD_ITEM', () => {
      expect(classifyIntent('leite e pão')).toEqual({ intent: 'ADD_ITEM' });
    });
  });

  describe('REMOVE_ITEM', () => {
    it('should classify "tirar banana" as REMOVE_ITEM with itemName', () => {
      expect(classifyIntent('tirar banana')).toEqual({
        intent: 'REMOVE_ITEM',
        itemName: 'banana',
      });
    });

    it('should classify "remover leite" as REMOVE_ITEM with itemName', () => {
      expect(classifyIntent('remover leite')).toEqual({
        intent: 'REMOVE_ITEM',
        itemName: 'leite',
      });
    });

    it('should classify "- leite" as REMOVE_ITEM with itemName', () => {
      expect(classifyIntent('- leite')).toEqual({
        intent: 'REMOVE_ITEM',
        itemName: 'leite',
      });
    });

    it('should classify "tirar o arroz" as REMOVE_ITEM with itemName', () => {
      expect(classifyIntent('tirar o arroz')).toEqual({
        intent: 'REMOVE_ITEM',
        itemName: 'arroz',
      });
    });
  });

  describe('SHOW_LIST', () => {
    it('should classify "ver lista" as SHOW_LIST', () => {
      expect(classifyIntent('ver lista')).toEqual({ intent: 'SHOW_LIST' });
    });

    it('should classify "mostrar lista" as SHOW_LIST', () => {
      expect(classifyIntent('mostrar lista')).toEqual({ intent: 'SHOW_LIST' });
    });

    it('should classify "lista" as SHOW_LIST', () => {
      expect(classifyIntent('lista')).toEqual({ intent: 'SHOW_LIST' });
    });
  });

  describe('FINALIZE_LIST', () => {
    it('should classify "finalizar pedido" as FINALIZE_LIST', () => {
      expect(classifyIntent('finalizar pedido')).toEqual({
        intent: 'FINALIZE_LIST',
      });
    });

    it('should classify "fechar lista" as FINALIZE_LIST', () => {
      expect(classifyIntent('fechar lista')).toEqual({
        intent: 'FINALIZE_LIST',
      });
    });
  });

  describe('SMALL_TALK', () => {
    it('should classify "oi" as SMALL_TALK', () => {
      expect(classifyIntent('oi')).toEqual({ intent: 'SMALL_TALK' });
    });

    it('should classify "olá" as SMALL_TALK', () => {
      expect(classifyIntent('olá')).toEqual({ intent: 'SMALL_TALK' });
    });

    it('should classify "bom dia" as SMALL_TALK', () => {
      expect(classifyIntent('bom dia')).toEqual({ intent: 'SMALL_TALK' });
    });

    it('should classify "ok" as SMALL_TALK', () => {
      expect(classifyIntent('ok')).toEqual({ intent: 'SMALL_TALK' });
    });
  });

  describe('UNKNOWN', () => {
    it('should classify empty string as UNKNOWN', () => {
      expect(classifyIntent('')).toEqual({ intent: 'UNKNOWN' });
    });
  });
});
