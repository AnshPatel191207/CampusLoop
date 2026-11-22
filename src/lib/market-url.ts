export function marketHref(params: Record<string, string>, changes: Record<string, string | undefined> = {}) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return '/' + (next.size ? '?' + next : '') + '#market';
}
