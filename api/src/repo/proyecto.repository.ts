import { MockApiClient } from "../clients";
import { MockApiProyecto } from "../clients/mock-api";
import { type Proyecto, type PaginateResponseShape as PagResShape, IntoProyecto, round_a_tres } from "../model";
import { type Region, type ResumenRegion } from "../model/proyecto";

const PAGE_SIZE = 20;

export class ProyectoRepository {
  /// Voy a ocupar este Hashmap como base de datos momentaneamente.
  private store = new Map<Proyecto["id"], Proyecto>();

  /// Busca una pagina desde el MockApiClient
  private async fetchPage(page: number): Promise<PagResShape<MockApiProyecto>> {
    const { data } = await MockApiClient.get<PagResShape<MockApiProyecto>>("/proyectos", {
      params: { page, page_size: PAGE_SIZE },
    });
    return data;
  }

  async load(): Promise<void> {
    /// sacamos la primera pagina para ver cuantas paginas tenemos
    const first = await this.fetchPage(1);

    /// pedimos el resto de paginas en paralelo
    const paginas_totales = Math.max(first.total_pages - 1, 0);
    const promises = Array.from({ length: paginas_totales }, (_, i) => this.fetchPage(i + 2));
    const rest = await Promise.all(promises);

    const dtos = [first, ...rest].flatMap((p) => p.items);

    if (dtos.length !== first.total_items) {
      console.warn(`esperaba ${first.total_items} items, recibí ${dtos.length}`);
    }

    const next = new Map<Proyecto["id"], Proyecto>();
    for (const dto of dtos) {
      try {
        const proyecto = toProyecto(dto);
        const existing = next.get(proyecto.id);

        if (existing) {
          const keepNew = proyecto.updated_at.getTime() > existing.updated_at.getTime();
          console.info(`id duplicado: ${proyecto.id}, se conserva el ${keepNew ? "nuevo" : "existente"}`);
          if (!keepNew) continue;
        }

        next.set(proyecto.id, proyecto);
      } catch (err) {
        console.info(`proyecto descartado (id=${dto.id}):`, err, { dto });
      }
    }

    this.store = next;
  }

  /// Obtiene todos los proyectos.
  getAll(filters: GetAllFilters = {}): Proyecto[] {
    const region = filters.region ? normalizar_filtro(filters.region) : undefined;
    const estado = filters.estado ? normalizar_filtro(filters.estado) : undefined;
    const { monto_minimo } = filters;

    return [...this.store.values()].filter((p) => {
      if (region && normalizar_filtro(p.region) !== region) return false;
      if (estado && normalizar_filtro(p.estado) !== estado) return false;
      if (monto_minimo !== undefined && p.monto_musd < monto_minimo) return false;
      return true;
    });
  }

  getResumenRegion(): ResumenRegion[] {
    const acc = new Map<Region, ResumenRegion>();

    for (const p of this.store.values()) {
      const row = acc.get(p.region) ?? { region: p.region, cantidad: 0, monto_total: 0 };
      row.cantidad += 1;
      row.monto_total += p.monto_musd;
      acc.set(p.region, row);
    }

    const copia = [...acc.values()];
    const final = copia.map((r) => ({ ...r, monto_total: round_a_tres(r.monto_total) }));

    return final.sort((a, b) => a.region.localeCompare(b.region));
  }
}

export type GetAllFilters = {
  region?: string;
  estado?: string;
  monto_minimo?: number;
};

const normalizar_filtro = (s: string) => s.trim().toLowerCase();

const toProyecto = (dto: MockApiProyecto): Proyecto => ({
  id: IntoProyecto.toId(dto.id),
  nombre: IntoProyecto.toName(dto.nombre),
  titular: IntoProyecto.toTitular(dto.titular),
  region: IntoProyecto.toRegion(dto.region),
  monto_musd: IntoProyecto.toMonto(dto.monto),
  fecha_ingreso: IntoProyecto.toFecha(dto.fecha_ingreso),
  estado: IntoProyecto.toEstado(dto.estado),
  updated_at: IntoProyecto.toUpdatedAt(dto.actualizado_en),
});
