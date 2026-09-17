const PALETA = ['#2E6BF0', '#34C77B', '#F0A93E', '#8B5CF6', '#E5533C', '#14B8A6', '#F472B6', '#0EA5E9'];

export function bojaSektora(sektorId: string): string {
  let hash = 0;
  for (let i = 0; i < sektorId.length; i++) {
    hash = (hash * 31 + sektorId.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}
