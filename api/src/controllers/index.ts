export { createProyectoController } from "./proyecto.controller";

export class BadRequestError extends Error {}

/// Parsea un Request Param de Express hacia UInt
export const parseIntParam = (
  name: string,
  raw: unknown,
  { min = 1, max = Number.MAX_SAFE_INTEGER } = {},
): number | undefined => {
  if (raw === undefined) return undefined;

  // rechaza arreglos
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw new BadRequestError(`${name} debe ser un entero natural`);
  }

  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < min || n > max) {
    throw new BadRequestError(`${name} debe estar entre ${min} y ${max}`);
  }

  return n;
};
