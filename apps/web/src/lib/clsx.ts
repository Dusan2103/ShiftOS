export type ClassValue = string | number | null | undefined | false | ClassValue[];

export function clsx(...vrednosti: ClassValue[]): string {
  const rezultat: string[] = [];
  for (const v of vrednosti) {
    if (!v) continue;
    if (Array.isArray(v)) {
      const spojeno = clsx(...v);
      if (spojeno) rezultat.push(spojeno);
    } else {
      rezultat.push(String(v));
    }
  }
  return rezultat.join(' ');
}
