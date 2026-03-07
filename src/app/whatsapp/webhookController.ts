import type { FastifyInstance } from 'fastify';
import { ListService } from '../../domain/listService.js';
import { HttpMessageService } from '../http/messageService.js';
import { createMessenger } from '../../infra/messenger/messengerFactory.js';
import { WhatsAppSender } from '../../infra/messenger/whatsappSender.js';
import type { ListItemRepository } from '../../domain/types.js';

interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product?: string;
      metadata?: {
        phone_number_id?: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: {
          body: string;
        };
        context?: {
          from: string;
          id: string;
        };
      }>;
      statuses?: Array<unknown>;
    };
  }>;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export async function registerWhatsAppWebhook(
  app: FastifyInstance,
  repository: ListItemRepository
): Promise<void> {
  const whatsappSender = new WhatsAppSender();

  // Só registra rotas se WhatsApp estiver configurado
  if (!whatsappSender.isEnabled()) {
    return;
  }

  const listService = new ListService(repository);
  const messageService = new HttpMessageService(listService);
  const messenger = createMessenger();

  // GET /webhook/whatsapp - Verificação do webhook
  app.get<{
    Querystring: {
      'hub.mode': string;
      'hub.verify_token': string;
      'hub.challenge': string;
    };
  }>('/webhook/whatsapp', async (request, reply) => {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    const verifyToken = whatsappSender.getVerifyToken();

    if (mode === 'subscribe' && token === verifyToken) {
      return reply.status(200).send(challenge);
    }

    return reply.status(403).send('Forbidden');
  });

  // POST /webhook/whatsapp - Receber mensagens
  app.post<{ Body: WhatsAppWebhookPayload }>(
    '/webhook/whatsapp',
    async (request, reply) => {
      const body = request.body;

      // Responde 200 imediatamente (webhook deve responder rápido)
      reply.status(200).send({ status: 'ok' });

      // Processa mensagens em background
      if (body.object === 'whatsapp_business_account' && body.entry) {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            const value = change.value;

            // Processa apenas mensagens recebidas (não status)
            if (value.messaging_product === 'whatsapp' && value.messages) {
              for (const message of value.messages) {
                // Ignora mensagens que não são de texto
                if (message.type !== 'text' || !message.text) {
                  continue;
                }

                const groupId = message.from; // WhatsApp usa "from" como ID do chat
                const userId = message.from; // Por enquanto, usar from como userId também
                const text = message.text.body;

                try {
                  const result = await messageService.handleMessage({
                    groupId,
                    userId,
                    text,
                  });

                  // Envia resposta via Messenger
                  if (result.message) {
                    await messenger.sendMessage(groupId, result.message);
                  }
                } catch (error) {
                  console.error('Error processing WhatsApp message:', error);
                  // Envia mensagem de erro
                  try {
                    await messenger.sendMessage(
                      groupId,
                      '❌ Erro ao processar mensagem'
                    );
                  } catch (sendError) {
                    console.error('Error sending error message:', sendError);
                  }
                }
              }
            }
          }
        }
      }

      return { status: 'ok' };
    }
  );
}
