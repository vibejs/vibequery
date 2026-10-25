export interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly ownerId: string;
}

export interface Todo {
  readonly id: number;
  readonly title: string;
  readonly done: boolean;
}

export let latency = 0;

const people: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Mathematician' },
  { id: 'grace', name: 'Grace Hopper', role: 'Computer scientist' },
  { id: 'katherine', name: 'Katherine Johnson', role: 'Mathematician' },
];

const projects: readonly Project[] = [
  { id: 'notes', title: 'Analytical notes', ownerId: 'ada' },
  { id: 'engine', title: 'Difference engine', ownerId: 'ada' },
  { id: 'cobol', title: 'COBOL', ownerId: 'grace' },
  { id: 'compiler', title: 'A-0 compiler', ownerId: 'grace' },
  { id: 'trajectory', title: 'Orbital trajectories', ownerId: 'katherine' },
];

const directory = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  name: `Record ${String(index + 1)}`,
}));

let todos: Todo[] = [{ id: 1, title: 'Read the cache', done: false }];
let nextTodoId = 2;
let pulseCount = 0;
let flakyAttempts = 0;
let directoryRevision = 1;

export async function wait(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw signal.reason ?? new Error('aborted');
  if (latency === 0) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => resolve(), latency);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error('aborted'));
    });
  });
}

export async function fetchPerson(id: string, signal?: AbortSignal): Promise<Person> {
  await wait(signal);
  const person = people.find((item) => item.id === id);
  if (!person) throw new Error(`No person ${id}`);
  return person;
}

export async function searchPeople(term: string, signal?: AbortSignal): Promise<readonly Person[]> {
  await wait(signal);
  const query = term.trim().toLowerCase();
  return people.filter((person) => person.name.toLowerCase().includes(query));
}

export async function fetchProjects(
  ownerId: string,
  signal?: AbortSignal,
): Promise<readonly Project[]> {
  await wait(signal);
  return projects.filter((project) => project.ownerId === ownerId);
}

export async function fetchPage(
  page: number,
  signal?: AbortSignal,
): Promise<{ readonly rows: readonly { id: number; name: string }[]; readonly pages: number }> {
  await wait(signal);
  const size = 6;
  return {
    rows: directory.slice((page - 1) * size, page * size),
    pages: Math.ceil(directory.length / size),
  };
}

export async function fetchFeed(
  pageParam: number,
  signal?: AbortSignal,
): Promise<{ readonly items: readonly string[]; readonly next?: number }> {
  await wait(signal);
  const size = 5;
  const start = pageParam * size;
  const items = directory.slice(start, start + size).map((row) => row.name);
  return { items, next: start + size < directory.length ? pageParam + 1 : undefined };
}

export async function fetchTodos(signal?: AbortSignal): Promise<readonly Todo[]> {
  await wait(signal);
  return todos.map((todo) => ({ ...todo }));
}

export async function createTodo(title: string): Promise<Todo> {
  await wait();
  if (title.trim().toLowerCase() === 'fail') throw new Error('The directory rejected that title.');
  const todo = { id: nextTodoId, title: title.trim(), done: false };
  nextTodoId += 1;
  todos = [...todos, todo];
  return todo;
}

export async function toggleTodo(id: number): Promise<Todo> {
  await wait();
  const current = todos.find((todo) => todo.id === id);
  if (!current) throw new Error(`No todo ${String(id)}`);
  const next = { ...current, done: !current.done };
  todos = todos.map((todo) => (todo.id === id ? next : todo));
  return next;
}

export async function fetchPulse(
  signal?: AbortSignal,
): Promise<{ readonly value: number; readonly at: number }> {
  await wait(signal);
  pulseCount += 1;
  return { value: pulseCount, at: Date.now() };
}

export async function fetchFlaky(signal?: AbortSignal): Promise<string> {
  await wait(signal);
  flakyAttempts += 1;
  if (flakyAttempts < 3) throw new Error('The directory is offline.');
  return 'The directory answered.';
}

export function resetFlaky(): void {
  flakyAttempts = 0;
}

export async function fetchRevision(signal?: AbortSignal): Promise<number> {
  await wait(signal);
  return directoryRevision;
}

export function bumpRevision(): void {
  directoryRevision += 1;
}
