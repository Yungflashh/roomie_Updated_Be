/**
 * Escape special regex characters in a string for safe use in MongoDB $regex.
 * Prevents ReDoS attacks from user-supplied search input.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
