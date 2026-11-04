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

/// Parsea un Request Param de Express hacia string (rechaza arreglos y vacíos)
export const parseStringParam = (name: string, raw: unknown): string | undefined => {
  if (raw === undefined) return undefined;

  if (typeof raw !== "string") {
    throw new BadRequestError(`${name} debe ser un string`);
  }

  const value = raw.trim();
  if (value === "") {
    throw new BadRequestError(`${name} no puede estar vacío`);
  }

  return value;
};

/// Parsea un Request Param de Express hacia un número no negativo (admite decimales)
export const parseNumberParam = (
  name: string,
  raw: unknown,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {},
): number | undefined => {
  if (raw === undefined) return undefined;

  if (typeof raw !== "string" || !/^\d+(\.\d+)?$/.test(raw)) {
    throw new BadRequestError(`${name} debe ser un número`);
  }

  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new BadRequestError(`${name} debe estar entre ${min} y ${max}`);
  }

  return n;
};
