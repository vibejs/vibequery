import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from '@usevibejs/ui';
import { QueryClient, createVibeQueryPlugin, useQuery } from '@usevibejs/query';
import { describe, expect, it } from 'vitest';

describe('published package', () => {
  it('resolves the built entry and keeps devtools and contract out of it', async () => {
    const source = readFileSync(resolve('dist/index.js'), 'utf8');
    expect(source).not.toContain('useQueryDevtools');
    expect(source).not.toContain('ApiResultError');
    const devtools = await import('@usevibejs/query/devtools');
    const contract = await import('@usevibejs/query/contract');
    expect(devtools.useQueryDevtools).toBeTypeOf('function');
    expect(contract.unwrapApiResult).toBeTypeOf('function');

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const app = createApp({
      name: 'PackageHost',
      setup: () => {
        const query = useQuery({
          queryKey: ['built'],
          queryFn: async () => 'from-dist',
        });
        return { query };
      },
      render: () => [],
    });
    app.use(createVibeQueryPlugin(client));
    const element = document.createElement('div');
    document.body.append(element);
    app.mount(element);
    expect(client.getQueryCache().find({ queryKey: ['built'] })).toBeDefined();
    await client.prefetchQuery({ queryKey: ['built'], queryFn: async () => 'from-dist' });
    expect(client.getQueryData(['built'])).toBe('from-dist');
    app.unmount();
    element.remove();
  });
});
