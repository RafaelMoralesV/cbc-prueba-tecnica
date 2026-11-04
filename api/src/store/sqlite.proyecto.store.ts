import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Proyecto } from "../model";
import type { ProyectoStore, Filtros, Pagina } from "./proyecto.store";
import { ResumenRegion } from "../model/proyecto";

export class SqliteProyectoStore implements ProyectoStore {
  private db: Database.Database;

  constructor(path = process.env.DB_PATH ?? "./data/proyectos.db") {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id            TEXT PRIMARY KEY,
        nombre        TEXT NOT NULL,
        titular       TEXT,
        region        TEXT NOT NULL,
        monto_musd    REAL NOT NULL,
        fecha_ingreso TEXT NOT NULL,
        estado        TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_proyectos_region ON proyectos(region);
      CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
    `);
  }

  async upsertMany(proyectos: Proyecto[]): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO proyectos (id, nombre, titular, region, monto_musd, fecha_ingreso, estado, updated_at)
      VALUES (@id, @nombre, @titular, @region, @monto_musd, @fecha_ingreso, @estado, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        nombre = excluded.nombre,
        titular = excluded.titular,
        region = excluded.region,
        monto_musd = excluded.monto_musd,
        fecha_ingreso = excluded.fecha_ingreso,
        estado = excluded.estado,
        updated_at = excluded.updated_at
      WHERE excluded.updated_at > proyectos.updated_at
    `);

    const runAll = this.db.transaction((rows: Proyecto[]) => {
      let cambios = 0;
      for (const p of rows) cambios += stmt.run(toRow(p)).changes;
      return cambios;
    });

    return runAll(proyectos);
  }

  async find(f: Filtros, { page, pageSize }: Pagina) {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    if (f.region) {
      where.push("region like @region");
      params.region = f.region;
    }
    if (f.estado) {
      where.push("estado like @estado");
      params.estado = f.estado;
    }
    if (f.monto_minimo !== undefined) {
      where.push("monto_musd >= @monto_min");
      params.monto_min = f.monto_minimo;
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { n } = this.db.prepare(`SELECT COUNT(*) AS n FROM proyectos ${clause}`).get(params) as { n: number };
    const rows = this.db
      .prepare(`SELECT * FROM proyectos ${clause} ORDER BY id ASC LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize });

    return { items: rows.map(fromRow), total: n };
  }

  async resumenPorRegion(): Promise<ResumenRegion[]> {
    return this.db
      .prepare(
        `
      SELECT region, COUNT(*) AS cantidad, ROUND(SUM(monto_musd), 3) AS monto_total
      FROM proyectos GROUP BY region ORDER BY region
    `,
      )
      .all() as ResumenRegion[];
  }
}

const toRow = (p: Proyecto) => ({
  id: p.id,
  nombre: p.nombre,
  titular: p.titular,
  region: p.region,
  monto_musd: p.monto_musd,
  fecha_ingreso: p.fecha_ingreso.toISOString(),
  estado: p.estado,
  updated_at: p.updated_at.toISOString(),
});

const fromRow = (r: any): Proyecto => ({
  id: r.id,
  nombre: r.nombre,
  titular: r.titular,
  region: r.region,
  monto_musd: r.monto_musd,
  fecha_ingreso: new Date(r.fecha_ingreso),
  estado: r.estado,
  updated_at: new Date(r.updated_at),
});
