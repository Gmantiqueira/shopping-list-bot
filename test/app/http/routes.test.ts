import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import Fastify from 'fastify';
import { MemoryListItemRepository } from '../../../src/infra/memory/memoryRepository.js';
import { registerHttpRoutes } from '../../../src/app/http/routes.js';

describe('HTTP Routes', () => {
  let app: ReturnType<typeof Fastify>;
  let repository: MemoryListItemRepository;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    repository = new MemoryListItemRepository();

    app.get('/health', async () => {
      return { status: 'ok' };
    });

    await registerHttpRoutes(app, repository);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /webhook/mock', () => {
    it('should process a simple item message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data?.added).toContain('leite');
    });

    it('should process multiple items', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'leite\npão\nmanteiga',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data?.added).toHaveLength(3);
      expect(body.data?.added).toContain('leite');
      expect(body.data?.added).toContain('pão');
      expect(body.data?.added).toContain('manteiga');
    });

    it('should process COMMAND_LIST', async () => {
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'lista',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data?.items).toBeDefined();
      expect(body.data?.items).toHaveLength(1);
      expect(body.data?.items[0].name).toBe('leite');
    });

    it('should process COMMAND_REMOVE', async () => {
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '- leite',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('Removido');
    });

    it('should process COMMAND_BOUGHT', async () => {
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'check leite',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('Comprado');
    });

    it('should process COMMAND_CLEAR', async () => {
      // Adiciona itens primeiro
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'leite\npão',
        },
      });

      // Primeira chamada: solicita confirmação
      const response1 = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'limpar lista',
        },
      });

      expect(response1.statusCode).toBe(200);
      const body1 = JSON.parse(response1.body);
      expect(body1.success).toBe(false);
      expect(body1.message).toContain('Confirmar');

      // Segunda chamada: confirma
      const response2 = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'SIM',
        },
      });

      expect(response2.statusCode).toBe(200);
      const body2 = JSON.parse(response2.body);
      expect(body2.success).toBe(true);
      expect(body2.message).toContain('limpa');
    });

    it('should return 400 for missing fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          // missing userId and text
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('should handle duplicate items', async () => {
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data?.duplicated).toContain('leite');
    });

    it('should ignore empty messages', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('ignorada');
    });
  });

  describe('GET /groups/:groupId/list', () => {
    it('should return empty list for new group', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/groups/group1/list',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.groupId).toBe('group1');
      expect(body.items).toHaveLength(0);
      expect(body.count).toBe(0);
      expect(body.pending).toBe(0);
      expect(body.bought).toBe(0);
    });

    it('should return list with items', async () => {
      // Adiciona itens
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'leite\npão',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/groups/group1/list',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.items).toHaveLength(2);
      expect(body.count).toBe(2);
      expect(body.pending).toBe(2);
      expect(body.bought).toBe(0);
    });

    it('should return items with correct status', async () => {
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'check leite',
        },
      });

      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 pão',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/groups/group1/list',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.items).toHaveLength(2);
      expect(body.pending).toBe(1);
      expect(body.bought).toBe(1);
      expect(body.items[0].status).toBe('pending'); // pão (mais recente)
      expect(body.items[1].status).toBe('bought'); // leite
    });

    it('should isolate groups', async () => {
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group2',
          userId: 'user1',
          text: '2 pão',
        },
      });

      const response1 = await app.inject({
        method: 'GET',
        url: '/groups/group1/list',
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/groups/group2/list',
      });

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      expect(body1.items).toHaveLength(1);
      expect(body1.items[0].name).toBe('leite');
      expect(body2.items).toHaveLength(1);
      expect(body2.items[0].name).toBe('pão');
    });
  });

  describe('POST /groups/:groupId/clear', () => {
    it('should clear empty list', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/groups/group1/clear',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.groupId).toBe('group1');
    });

    it('should clear list with items', async () => {
      // Adiciona itens
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: 'leite\npão\nmanteiga',
        },
      });

      // Limpa
      const response = await app.inject({
        method: 'POST',
        url: '/groups/group1/clear',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verifica que está vazio
      const listResponse = await app.inject({
        method: 'GET',
        url: '/groups/group1/list',
      });

      const listBody = JSON.parse(listResponse.body);
      expect(listBody.items).toHaveLength(0);
    });

    it('should only clear specified group', async () => {
      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group1',
          userId: 'user1',
          text: '2 leite',
        },
      });

      await app.inject({
        method: 'POST',
        url: '/webhook/mock',
        payload: {
          groupId: 'group2',
          userId: 'user1',
          text: '2 pão',
        },
      });

      // Limpa apenas group1
      await app.inject({
        method: 'POST',
        url: '/groups/group1/clear',
      });

      // Verifica isolamento
      const response1 = await app.inject({
        method: 'GET',
        url: '/groups/group1/list',
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/groups/group2/list',
      });

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      expect(body1.items).toHaveLength(0);
      expect(body2.items).toHaveLength(1);
      expect(body2.items[0].name).toBe('pão');
    });
  });
});
