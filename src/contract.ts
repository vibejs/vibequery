import type { ApiError, ApiResult, Route, RouteData } from '@usevibejs/contract';

interface ProblemLike {
  readonly code: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
}

/**
 * A failed `ApiResult` thrown so Query Core records it as a query or mutation error.
 * HTTP and network failures from `@usevibejs/contract` resolve instead of rejecting; this error
 * is the boundary between that result and Query Core.
 */
export class ApiResultError<E extends ProblemLike = ProblemLike> extends Error {
  override readonly name = 'ApiResultError';
  readonly problem: E;
  readonly response: Response | undefined;
  readonly code: string;
  readonly status: number;

  constructor(problem: E, response: Response | undefined) {
    super(problem.detail ?? problem.title);
    this.problem = problem;
    this.response = response;
    this.code = problem.code;
    this.status = problem.status;
  }
}

interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
  readonly response: Response;
}

interface ApiFailure<E extends ProblemLike> {
  readonly ok: false;
  readonly error: E;
  readonly response: Response | undefined;
}

/** The success data of `result`, or an {@link ApiResultError} when `result.ok` is false. */
export function unwrapApiResult<T, E extends ProblemLike>(
  result: ApiSuccess<T> | ApiFailure<E>,
): T {
  if (result.ok) return result.data;
  throw new ApiResultError(result.error, result.response);
}

/**
 * Unwraps a contract call for `queryFn` and `mutationFn`.
 * `ApiResult` is accepted structurally, so a typed contract client keeps its success type.
 *
 * @example
 * queryFn: ({ signal }) => fromApiResult(api.users.one({ params: { id } }, { signal }))
 */
export function fromApiResult<T, E extends ProblemLike>(
  result: ApiSuccess<T> | ApiFailure<E> | Promise<ApiSuccess<T> | ApiFailure<E>>,
): Promise<T> {
  return Promise.resolve(result).then((value) => unwrapApiResult(value));
}

export type { ApiError, ApiResult, Route, RouteData };
