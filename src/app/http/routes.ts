import type { FastifyInstance } from 'fastify';
import { ListService } from '../../domain/listService.js';
import { HttpMessageService } from './messageService.js';
import { eventBus } from '../../infra/eventbus/eventBus.js';
import type { ListItemRepository } from '../../domain/types.js';

interface WebhookBody {
  groupId: string;
  userId: string;
  text: string;
}

export async function registerHttpRoutes(
  app: FastifyInstance,
  repository: ListItemRepository
): Promise<void> {
  const listService = new ListService(repository);
  const messageService = new HttpMessageService(listService);

  // POST /webhook/mock
  app.post<{ Body: WebhookBody }>('/webhook/mock', async (request, reply) => {
    const { groupId, userId, text } = request.body;

    if (!groupId || !userId || text === undefined) {
      return reply.status(400).send({
        error: 'Missing required fields: groupId, userId, text',
      });
    }

    // Publica mensagem do usuário no EventBus antes de processar
    eventBus.publish(groupId, {
      id: crypto.randomUUID(),
      groupId,
      from: 'user',
      userId,
      text,
      createdAt: new Date().toISOString(),
    });

    const result = await messageService.handleMessage({
      groupId,
      userId,
      text,
    });

    return reply.status(200).send(result);
  });

  // GET /groups/:groupId/list
  app.get<{ Params: { groupId: string } }>(
    '/groups/:groupId/list',
    async (request, reply) => {
      const { groupId } = request.params;
      const items = await listService.listItems(groupId);

      return reply.status(200).send({
        groupId,
        items,
        count: items.length,
        pending: items.filter((i) => i.status === 'pending').length,
        bought: items.filter((i) => i.status === 'bought').length,
      });
    }
  );

  // POST /groups/:groupId/clear
  app.post<{ Params: { groupId: string } }>(
    '/groups/:groupId/clear',
    async (request, reply) => {
      const { groupId } = request.params;
      await listService.clearList(groupId);

      return reply.status(200).send({
        success: true,
        message: 'Lista limpa',
        groupId,
      });
    }
  );
}
