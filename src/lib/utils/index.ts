// https://jaketrent.com/post/typescript-type-safe-filter-boolean/
export function isDefined<T>(value: T | null | undefined): value is NonNullable<T> {
  return value !== null && value !== undefined
}
