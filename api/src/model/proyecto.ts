import { colapsarEspacios, containsToken, esDigito, quitarAcentos, round_a_tres } from ".";

/// Id valida de un proyecto. No puede ser Vacia.
export type Id = string;

export const toId = (id_raw: string): Id => {
  const id = id_raw.toLowerCase().trim();

  if (!id) {
    throw new Error(`id_vacio`);
  }

  return id as Id;
};

/// Nombre de un proyecto. Sin espacios multiples entre medio. No puede ser vacio.
export type Name = string;
export const toName = (raw: string): Name => {
  const name = colapsarEspacios(raw);
  if (!name) throw new Error("nombre_vacio");
  return name;
};

/// Titular de un proyecto.
export type Titular = string;
export const toTitular = (raw: string): Titular => {
  const t = raw.trim();
  if (!t) throw new Error("titular_vacio");
  return t;
};

/// Region de un proyecto.
export type Region = string;

const normalizarRegion = (raw: string): string => colapsarEspacios(quitarAcentos(raw ?? "").toLowerCase());

const REGIONES = new Map<string, Region>([
  ["arica y parinacota", "Arica y Parinacota"],
  ["tarapaca", "Tarapacá"],
  ["antofagasta", "Antofagasta"],
  ["atacama", "Atacama"],
  ["coquimbo", "Coquimbo"],
  ["valparaiso", "Valparaíso"],
  ["metropolitana de santiago", "Metropolitana de Santiago"],
  ["o'higgins", "O'Higgins"],
  ["maule", "Maule"],
  ["nuble", "Ñuble"],
  ["biobio", "Biobío"],
  ["la araucania", "La Araucanía"],
  ["los rios", "Los Ríos"],
  ["los lagos", "Los Lagos"],
  ["aysen", "Aysén"],
  ["magallanes", "Magallanes"],
  ["xv region", "Arica y Parinacota"],
  ["i region", "Tarapacá"],
  ["ii region", "Antofagasta"],
  ["iii region", "Atacama"],
  ["iv region", "Coquimbo"],
  ["v region", "Valparaíso"],
  ["region metropolitana", "Metropolitana de Santiago"],
  ["vi region", "O'Higgins"],
  ["vii region", "Maule"],
  ["xvi region", "Ñuble"],
  ["viii region", "Biobío"],
  ["ix region", "La Araucanía"],
  ["xiv region", "Los Ríos"],
  ["x region", "Los Lagos"],
  ["xi region", "Aysén"],
  ["xii region", "Magallanes"],
]);

export const toRegion = (raw: string): Region => {
  let base = normalizarRegion(raw);
  if (!base) throw new Error("region_vacia");

  // viene con el prefijo ese de 'region de'
  if (base.startsWith("region de ")) {
    base = base.slice("region de ".length);
  }

  // buscamos que tengamos la region
  const directa = REGIONES.get(base);
  if (directa) return directa;

  // no la tenemos
  throw new Error("region_desconocida");
};

/// Monto de un proyecto en millones de pesos.
export type Monto = number;

const parseMontoChileno = (raw: string): number => {
  const s = quitarAcentos(raw ?? "")
    .toLowerCase()
    .trim();

  let firstDigit = -1;
  for (let i = 0; i < s.length; i++) {
    if (esDigito(s[i])) {
      firstDigit = i;
      break;
    }
  }

  // me mandaron un monto que no tiene ni un numero
  if (firstDigit === -1) throw new Error("monto_invalido");

  // viene con un guion de negativo, chao
  const prefix = s.slice(0, firstDigit);
  if (prefix.indexOf("-") !== -1 || prefix.indexOf("\u2212") !== -1) {
    throw new Error("monto_negativo");
  }

  const inMillions = s.indexOf("millon") !== -1 || containsToken(s, "mm");

  let numeric = "";
  for (const ch of s) {
    if (esDigito(ch) || ch === "." || ch === ",") numeric += ch;
  }

  let normalized = "";
  for (const ch of numeric) {
    if (ch === ",") normalized += ".";
    else if (ch !== ".") normalized += ch;
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) throw new Error("monto_invalido");

  const value = inMillions ? n : n / 1_000_000;
  return round_a_tres(value);
};

export const toMonto = (raw: number | string): Monto => {
  const n = typeof raw === "number" ? raw : parseMontoChileno(raw);

  if (!Number.isFinite(n)) throw new Error("monto_invalido");
  if (n <= 0) throw new Error("monto_negativo");

  return round_a_tres(n);
};

/// Fecha del proyecto.
export type Fecha = Date;
const MESES = new Map<string, string>([
  ["ene", "01"],
  ["feb", "02"],
  ["mar", "03"],
  ["abr", "04"],
  ["may", "05"],
  ["jun", "06"],
  ["jul", "07"],
  ["ago", "08"],
  ["sep", "09"],
  ["oct", "10"],
  ["nov", "11"],
  ["dic", "12"],
]);

export const toFecha = (raw: string): Fecha => {
  let s = quitarAcentos(raw ?? "")
    .trim()
    .toLowerCase();
  if (!s) throw new Error("fecha_invalida");

  // podemos convertir la forma 3 en la 2 reemplazando -mmm- hacia /m/ en numero
  if (s.indexOf("/") === -1) {
    const partes = s.split("-");
    if (partes.length === 3 && partes[0].length === 2) {
      const mes = MESES.get(partes[1]);
      if (mes !== undefined) s = partes[0] + "/" + mes + "/" + partes[2];
    }
  }

  // con el cambio anterior todas las fechas tienen que tener 10 caracteres para ser validas
  if (s.length !== 10) throw new Error("fecha_invalida");

  // como quedan dos formas revisamos cual tenemos y parseamos
  let iso: string;
  if (s[2] === "/" && s[5] === "/") {
    iso = s.slice(6, 10) + "-" + s.slice(3, 5) + "-" + s.slice(0, 2);
  } else if (s[4] === "-" && s[7] === "-") {
    iso = s;
  } else {
    throw new Error("fecha_invalida");
  }

  // convertimos hacia ISO 8601
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error("fecha_invalida");
  return d;
};

/// Estados validos de un proyecto.
export type Estado = "En evaluación" | "Aprobado" | "Rechazado";

export const toEstado = (raw: string): Estado => {
  const normalized = quitarAcentos(raw).trim().toLowerCase();

  const map: Record<string, Estado> = {
    "en evaluacion": "En evaluación",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
  };

  const estado = map[normalized];
  if (!estado) throw new Error(`estado_desconocido: ${estado}`);
  return estado;
};

export type Timestamp = Date;
export const toUpdatedAt = (raw: string): Timestamp => {
  const s = (raw ?? "").trim();
  if (!s) throw new Error("actualizado_en_vacio");

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error("actualizado_en_invalido");
  return d;
};

/// Proyecto
export type Proyecto = {
  id: Id;
  nombre: Name;
  titular: Titular;
  region: Region;
  monto_musd: Monto;
  fecha_ingreso: Fecha;
  estado: Estado;
  updated_at: Timestamp;
};
