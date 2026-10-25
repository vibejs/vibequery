# Common mistakes

**Destructuring the result.** `const { data } = useQuery(...)` copies the value from the moment of
setup. Read `user.data` on the stable object instead.

**Hiding dependencies inside `queryFn`.** A ref read only while the request runs does not change
the observer. Put it in `queryKey` or in a tracked option getter.

**Using a query callback as a getter.** `enabled: (query) => flag.value` is passed to Query Core
and does not subscribe to `flag`. Use `enabled: () => flag.value` or `enabled: flag`.

**Returning a promise from an option getter.** Option getters are synchronous. The error tells you
which field returned a promise. Fetch in `queryFn` or `mutationFn`.

**Forgetting `signal`.** `cancelQueries` and key changes abort the request only after `queryFn`
reads `context.signal`.

**Expecting a contract call to throw.** `createClient` resolves `{ ok: false }` for HTTP and
network failures. Use `fromApiResult` when that failure should be a query error.

**Installing two copies of Query Core.** Import `QueryClient` from `@usevibejs/query`.

**A shared client is not a global.** Create the plugin with the client you want. Apps that do not
receive that plugin have an empty injection context, and `useQueryClient()` throws.

**Reading devtools in production by accident.** Import `@usevibejs/query/devtools` only from the
development UI. The main entry does not export it.
