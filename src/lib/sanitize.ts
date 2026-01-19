/**
 * Sanitizes a string for safe use in HTML contexts.
 * Escapes HTML special characters to prevent XSS attacks.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes an object's string properties for safe use in HTML.
 * Returns a new object with all string values escaped.
 */
export function sanitizeForHtml<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      (result as any)[key] = escapeHtml(result[key]);
    }
  }
  return result;
}
