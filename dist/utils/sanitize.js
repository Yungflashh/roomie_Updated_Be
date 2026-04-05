"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegex = escapeRegex;
/**
 * Escape special regex characters in a string for safe use in MongoDB $regex.
 * Prevents ReDoS attacks from user-supplied search input.
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=sanitize.js.map