import type { FastifyInstance } from 'fastify';
import { eventBus } from '../../infra/eventbus/eventBus.js';

export async function registerSimulatorRoutes(
  app: FastifyInstance
): Promise<void> {
  // GET /sim/events - SSE stream para mensagens
  app.get<{ Querystring: { groupId: string } }>(
    '/sim/events',
    async (request, reply) => {
      const { groupId } = request.query;

      if (!groupId) {
        return reply.status(400).send({ error: 'groupId is required' });
      }

      // Configura headers para SSE
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no'); // Nginx

      // Envia histórico inicial
      const history = eventBus.getHistory(groupId);
      for (const message of history) {
        reply.raw.write(`event: message\n`);
        reply.raw.write(`data: ${JSON.stringify(message)}\n\n`);
      }

      // Subscribe para novas mensagens
      const unsubscribe = eventBus.subscribe(groupId, (message) => {
        try {
          reply.raw.write(`event: message\n`);
          reply.raw.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
          console.error('Error writing SSE message:', error);
          unsubscribe();
        }
      });

      // Heartbeat a cada 15 segundos
      const heartbeatInterval = setInterval(() => {
        try {
          reply.raw.write(`: heartbeat\n\n`);
        } catch (error) {
          clearInterval(heartbeatInterval);
          unsubscribe();
        }
      }, 15000);

      // Limpa ao desconectar
      request.raw.on('close', () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
      });
    }
  );

  // GET /sim/history - Histórico de mensagens
  app.get<{ Querystring: { groupId: string } }>(
    '/sim/history',
    async (request, reply) => {
      const { groupId } = request.query;

      if (!groupId) {
        return reply.status(400).send({ error: 'groupId is required' });
      }

      const history = eventBus.getHistory(groupId);
      return reply.status(200).send({ groupId, messages: history });
    }
  );
}
