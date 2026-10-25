import { createClient, defineContract, get } from '@usevibejs/contract';
import * as v from 'valibot';

const Profile = v.object({ id: v.string(), name: v.string(), role: v.string() });

export const directory = defineContract('/directory', {
  one: get('/:id', {
    response: Profile,
    errors: { PERSON_NOT_FOUND: 404 },
  }),
});

const profiles: Record<string, { id: string; name: string; role: string }> = {
  ada: { id: 'ada', name: 'Ada Lovelace', role: 'Mathematician' },
};

export const directoryApi = createClient(directory, {
  baseUrl: 'https://directory.test',
  fetch: (request) => {
    const id = new URL(request.url).pathname.split('/').at(-1) ?? '';
    const profile = profiles[id];
    if (!profile) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            type: 'about:blank',
            title: 'Not found',
            status: 404,
            code: 'PERSON_NOT_FOUND',
            detail: `No profile ${id}`,
          }),
          { status: 404, headers: { 'content-type': 'application/problem+json' } },
        ),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify(profile), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  },
});
