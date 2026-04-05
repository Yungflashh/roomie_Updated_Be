/**
 * Escape special regex characters in a string for safe use in MongoDB $regex.
 * Prevents ReDoS attacks from user-supplied search input.
 */
export declare function escapeRegex(str: string): string;
//# sourceMappingURL=sanitize.d.ts.map