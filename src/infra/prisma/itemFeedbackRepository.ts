import { getPrismaClient } from './prismaClient.js';
import type {
  ItemFeedback,
  ItemFeedbackRepository,
  CreateItemFeedbackInput,
  ItemFeedbackType,
} from '../../domain/types.js';

export class PrismaItemFeedbackRepository implements ItemFeedbackRepository {
  private prisma = getPrismaClient();

  async save(input: CreateItemFeedbackInput): Promise<ItemFeedback> {
    const saved = await this.prisma.itemFeedback.create({
      data: {
        parseEventId: input.parseEventId ?? null,
        groupId: input.groupId,
        userId: input.userId,
        rawText: input.rawText,
        wrongItemsJson:
          input.wrongItems && input.wrongItems.length > 0
            ? JSON.stringify(input.wrongItems)
            : null,
        correctItemsJson:
          input.correctItems && input.correctItems.length > 0
            ? JSON.stringify(input.correctItems)
            : null,
        feedbackType: input.feedbackType,
      },
    });

    return {
      id: saved.id,
      parseEventId: saved.parseEventId,
      groupId: saved.groupId,
      userId: saved.userId,
      rawText: saved.rawText,
      wrongItemsJson: saved.wrongItemsJson,
      correctItemsJson: saved.correctItemsJson,
      feedbackType: saved.feedbackType as ItemFeedbackType,
      createdAt: saved.createdAt,
    };
  }
}
