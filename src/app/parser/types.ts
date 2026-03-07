import type { ShoppingItem } from '../../domain/types.js';

export interface ParseInput {
  text: string;
  groupId: string;
  userId: string;
}

export type ParseResult =
  | { type: 'COMMAND_LIST' }
  | { type: 'COMMAND_CLEAR' }
  | { type: 'COMMAND_REMOVE'; name: string }
  | { type: 'COMMAND_BOUGHT'; name: string }
  | { type: 'COMMAND_LIST_ALIASES' }
  | { type: 'ALIAS_LEARN'; raw: string; canonical: string }
  | { type: 'ITEMS'; items: ShoppingItem[] }
  | { type: 'IGNORE' };
