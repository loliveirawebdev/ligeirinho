import { toBranded, type Brand } from './brand';

export type UserId = Brand<string, 'UserId'>;

export function toUserId(rawUserId: string): UserId {
  return toBranded<UserId>(rawUserId);
}
