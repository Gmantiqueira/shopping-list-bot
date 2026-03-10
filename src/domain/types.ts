export type ItemStatus = 'pending' | 'bought';

/**
 * Item de compra estruturado com quantidade e unidade
 */
export interface ShoppingItem {
  name: string;
  quantity?: number;
  unit?: string;
}

/**
 * Item persistido na lista
 */
export interface Item {
  id: string;
  listId: string;
  groupId: string;
  name: string;
  quantity: number;
  unit: string;
  status: ItemStatus;
  createdBy: string;
  createdAt: Date;
  boughtBy?: string;
  boughtAt?: Date;
}

export interface AddItemsResult {
  added: Item[];
  duplicated: ShoppingItem[];
}

export interface ListItemRepository {
  getOrCreateListId(groupId: string): Promise<string>;
  findByGroupId(groupId: string): Promise<Item[]>;
  findByGroupIdAndName(
    groupId: string,
    normalizedName: string
  ): Promise<Item | null>;
  save(item: Item): Promise<Item>;
  delete(itemId: string): Promise<void>;
  deleteByGroupId(groupId: string): Promise<void>;
}

export interface MessageParseEvent {
  id: string;
  groupId: string;
  userId: string;
  rawText: string;
  ruleItemsJson: string | null;
  llmItemsJson: string | null;
  finalItemsJson: string | null;
  usedLlm: boolean;
  confidence: number | null;
  status: 'accepted' | 'ignored' | 'failed';
  createdAt: Date;
}

export interface CreateMessageParseEventInput {
  groupId: string;
  userId: string;
  rawText: string;
  ruleItems?: string[];
  llmItems?: string[];
  finalItems?: string[];
  usedLlm?: boolean;
  confidence?: number;
  status: 'accepted' | 'ignored' | 'failed';
}

export interface MessageParseEventRepository {
  save(event: CreateMessageParseEventInput): Promise<MessageParseEvent>;
}

export type ItemFeedbackType =
  | 'replace'
  | 'remove_false_positive'
  | 'add_missing_item'
  | 'alias_manual';

export interface ItemFeedback {
  id: string;
  parseEventId: string | null;
  groupId: string;
  userId: string;
  rawText: string;
  wrongItemsJson: string | null;
  correctItemsJson: string | null;
  feedbackType: ItemFeedbackType;
  createdAt: Date;
}

export interface CreateItemFeedbackInput {
  parseEventId?: string;
  groupId: string;
  userId: string;
  rawText: string;
  wrongItems?: string[];
  correctItems?: string[];
  feedbackType: ItemFeedbackType;
}

export interface ItemFeedbackRepository {
  save(feedback: CreateItemFeedbackInput): Promise<ItemFeedback>;
}

export type AliasSource = 'manual' | 'feedback' | 'auto_promoted';

export interface GroupItemAlias {
  id: string;
  groupId: string;
  rawTerm: string;
  canonicalItem: string;
  source: AliasSource;
  usageCount: number;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGroupItemAliasInput {
  groupId: string;
  rawTerm: string;
  canonicalItem: string;
  source: AliasSource;
}

export interface UpdateGroupItemAliasInput {
  canonicalItem?: string;
  source?: AliasSource;
  usageCount?: number;
  lastSeenAt?: Date;
}

export interface GroupItemAliasRepository {
  findByGroupIdAndRawTerm(
    groupId: string,
    rawTerm: string
  ): Promise<GroupItemAlias | null>;
  findByGroupId(groupId: string): Promise<GroupItemAlias[]>;
  save(input: CreateGroupItemAliasInput): Promise<GroupItemAlias>;
  update(id: string, input: UpdateGroupItemAliasInput): Promise<GroupItemAlias>;
  upsert(input: CreateGroupItemAliasInput): Promise<GroupItemAlias>;
}
