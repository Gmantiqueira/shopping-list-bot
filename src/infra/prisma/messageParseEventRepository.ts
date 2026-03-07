import { getPrismaClient } from './prismaClient.js';
import type {
  MessageParseEvent,
  MessageParseEventRepository,
  CreateMessageParseEventInput,
} from '../../domain/types.js';

export class PrismaMessageParseEventRepository implements MessageParseEventRepository {
  private prisma = getPrismaClient();

  async save(input: CreateMessageParseEventInput): Promise<MessageParseEvent> {
    const saved = await this.prisma.messageParseEvent.create({
      data: {
        groupId: input.groupId,
        userId: input.userId,
        rawText: input.rawText,
        ruleItemsJson:
          input.ruleItems && input.ruleItems.length > 0
            ? JSON.stringify(input.ruleItems)
            : null,
        llmItemsJson:
          input.llmItems && input.llmItems.length > 0
            ? JSON.stringify(input.llmItems)
            : null,
        finalItemsJson:
          input.finalItems && input.finalItems.length > 0
            ? JSON.stringify(input.finalItems)
            : null,
        usedLlm: input.usedLlm ?? false,
        confidence: input.confidence ?? null,
        status: input.status,
      },
    });

    return {
      id: saved.id,
      groupId: saved.groupId,
      userId: saved.userId,
      rawText: saved.rawText,
      ruleItemsJson: saved.ruleItemsJson,
      llmItemsJson: saved.llmItemsJson,
      finalItemsJson: saved.finalItemsJson,
      usedLlm: saved.usedLlm,
      confidence: saved.confidence,
      status: saved.status as 'accepted' | 'ignored' | 'failed',
      createdAt: saved.createdAt,
    };
  }
}
