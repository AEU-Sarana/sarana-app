/**
 * Generates initials from a full name.
 * Handles null/undefined and single words.
 *
 * @param name The name to extract initials from.
 * @param fallback The fallback initials to return if no name is provided.
 * @returns Initials string.
 */
export function getInitials(name: string | null | undefined, fallback: string = 'AD'): string {
  if (!name) return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase() || fallback;
}
