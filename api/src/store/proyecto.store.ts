import { type Proyecto } from "../model";
import type { ResumenRegion } from "../model/proyecto";

export type Filtros = { region?: string; estado?: string; monto_minimo?: number };
export type Pagina = { page: number; pageSize: number };

export interface ProyectoStore {
  upsertMany(proyectos: Proyecto[]): Promise<number>;
  find(filtros: Filtros, pagina: Pagina): Promise<{ items: Proyecto[]; total: number }>;
  resumenPorRegion(): Promise<ResumenRegion[]>;
}
