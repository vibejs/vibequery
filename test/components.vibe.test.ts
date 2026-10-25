import { flushPromises, mount } from '@usevibejs/ui/testing';
import { afterEach, describe, expect, it } from 'vitest';
import QueryDevtools from '../devtools/QueryDevtools.vibe';
import { createVibeQueryPlugin } from '../src/client.ts';
import { createTestClient } from '../src/test-utils.ts';
import { loadUser, resetUserLoads, userLoads } from './fixtures/api.ts';
import SearchBox from './fixtures/SearchBox.vibe';
import UserCard from './fixtures/UserCard.vibe';

describe('.vibe components', () => {
  afterEach(() => {
    resetUserLoads();
  });

  it('renders a query and shares one request across two cards', async () => {
    const client = createTestClient();
    const plugin = createVibeQueryPlugin(client);
    const first = mount(UserCard, { plugins: [plugin] });
    const second = mount(UserCard, { plugins: [plugin] });
    expect(first.text()).toContain('Loading');
    await flushPromises();
    expect(first.text()).toContain('Ada');
    expect(second.text()).toContain('Ada');
    expect(userLoads).toBe(1);
    expect(await loadUser()).toEqual({ name: 'Ada' });
    first.unmount();
    second.unmount();
    expect(
      client
        .getQueryCache()
        .find({ queryKey: ['user'] })
        ?.getObserversCount(),
    ).toBe(0);
  });

  it('refetches when the search field changes the query key', async () => {
    const wrapper = mount(SearchBox, { plugins: [createVibeQueryPlugin(createTestClient())] });
    await flushPromises();
    expect(wrapper.text()).toContain('result:ada');
    await wrapper.get('input').setValue('grace');
    await flushPromises();
    expect(wrapper.text()).toContain('result:grace');
    wrapper.unmount();
  });

  it('opens the devtools panel for the active cache', async () => {
    const client = createTestClient();
    await client.prefetchQuery({ queryKey: ['user'], queryFn: async () => ({ name: 'Ada' }) });
    const wrapper = mount(QueryDevtools, { plugins: [createVibeQueryPlugin(client)] });
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
    await wrapper.get('button').trigger('click');
    expect(wrapper.text()).toContain('["user"]');
    expect(wrapper.text()).toContain('success');
    expect(wrapper.text()).toContain('fresh');
    const clear = wrapper.findAll('button')[1];
    if (!clear) throw new Error('missing clear button');
    await clear.trigger('click');
    wrapper.unmount();
  });
});
