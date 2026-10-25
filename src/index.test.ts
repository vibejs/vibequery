import { describe, expect, it } from 'vitest';
import {
  CancelledError,
  QueryClient,
  dehydrate,
  hashKey,
  hydrate,
  isCancelledError,
  keepPreviousData,
  matchMutation,
  matchQuery,
  partialMatchKey,
  replaceEqualDeep,
  skipToken,
} from './index.ts';

describe('public entry', () => {
  it('re-exports the query core helpers the adapter builds on', () => {
    const client = new QueryClient();
    client.setQueryData(['user', 1], { name: 'Ada' });
    const dehydrated = dehydrate(client);
    const restored = new QueryClient();
    hydrate(restored, dehydrated);
    expect(restored.getQueryData(['user', 1])).toEqual({ name: 'Ada' });
    expect(hashKey(['user', 1])).toBeTypeOf('string');
    expect(partialMatchKey(['user', 1], ['user'])).toBe(true);
    const query = client.getQueryCache().find({ queryKey: ['user', 1] });
    expect(query).toBeDefined();
    expect(matchQuery({ queryKey: ['user'] }, query!)).toBe(true);
    expect(matchMutation).toBeTypeOf('function');
    expect(replaceEqualDeep({ n: 1 }, { n: 1 })).toEqual({ n: 1 });
    expect(keepPreviousData(1)).toBe(1);
    const cancelled = new CancelledError();
    expect(isCancelledError(cancelled)).toBe(true);
    expect(typeof skipToken).toBe('symbol');
    client.clear();
  });
});
