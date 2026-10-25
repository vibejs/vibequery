import { skipToken, useInfiniteQuery, useMutation, useQuery, queryOptions } from './index.ts';

const selected = useQuery({
  queryKey: ['user'] as const,
  queryFn: async () => ({ id: 1, name: 'Ada' }),
  select: (user) => user.name,
});
const name: string | undefined = selected.data;

const seeded = useQuery({
  queryKey: ['n'] as const,
  queryFn: async () => 1,
  initialData: 0,
});
const ready: number = seeded.data;

const named = queryOptions({
  queryKey: ['user'] as const,
  queryFn: async () => ({ id: 1 }),
});
const fromOptions = useQuery(named);
const id: number | undefined = fromOptions.data?.id;

const skipped = useQuery({
  queryKey: ['skipped'] as const,
  queryFn: skipToken,
});
const skippedData: unknown = skipped.data;

const mutation = useMutation({
  mutationFn: async (title: string) => ({ title }),
});
mutation.mutate('a');
const title: string | undefined = mutation.data?.title;

const pages = useInfiniteQuery({
  queryKey: ['page'] as const,
  queryFn: async ({ pageParam }) => pageParam,
  initialPageParam: 0,
  getNextPageParam: (last) => last + 1,
});
const first: number | undefined = pages.data?.pages[0];

useQuery({
  // @ts-expect-error queryKey must be an array
  queryKey: 'user',
  queryFn: async () => 1,
});

void name;
void ready;
void id;
void skippedData;
void title;
void first;
