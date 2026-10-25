import { flushPromises, mount } from '@usevibejs/ui/testing';
import { QueryClient, createVibeQueryPlugin } from '@usevibejs/query';
import { describe, expect, it } from 'vitest';
import Search from '../src/examples/Search.vibe';
import Users from '../src/examples/Users.vibe';

function plugin(): ReturnType<typeof createVibeQueryPlugin> {
  return createVibeQueryPlugin(
    new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }),
  );
}

describe('gallery', () => {
  it('renders a cached person from the built package', async () => {
    const wrapper = mount(Users, { plugins: [plugin()] });
    await flushPromises();
    expect(wrapper.text()).toContain('Ada Lovelace');
    wrapper.unmount();
  });

  it('searches when the query key changes', async () => {
    const wrapper = mount(Search, { plugins: [plugin()] });
    expect(wrapper.text()).toContain('Type a name');
    await wrapper.get('input').setValue('grace');
    await flushPromises();
    expect(wrapper.text()).toContain('Grace Hopper');
    wrapper.unmount();
  });
});
