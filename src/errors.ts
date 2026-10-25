/** Raised when VibeQuery is used outside a supported setup or with options it cannot apply. */
export class VibeQueryError extends Error {
  override readonly name = 'VibeQueryError';
}
