export type { Proyecto } from "./proyecto";
export * as IntoProyecto from "./proyecto";
export type { PaginateResponseShape } from "./response";

export const quitarAcentos = (s: string): string => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const colapsarEspacios = (s: string): string => s.split(" ").filter(Boolean).join(" ");

export const esDigito = (ch: string): boolean => ch >= "0" && ch <= "9";
export const esLetra = (ch: string): boolean => ch >= "a" && ch <= "z";

/// busca un token/palabra dentro de un string
export const containsToken = (s: string, token: string): boolean => {
  let from = 0;
  while (true) {
    const i = s.indexOf(token, from);
    if (i === -1) return false;
    const before = i === 0 ? "" : s[i - 1];
    const after = i + token.length >= s.length ? "" : s[i + token.length];
    if (!esLetra(before) && !esLetra(after)) return true;
    from = i + 1;
  }
};

export const round_a_tres = (n: number): number => Math.round(n * 1000) / 1000;
