import { MockApiClient } from "../clients";
import { MockApiProyecto } from "../clients/mock-api";
import { type Proyecto, type PaginateResponseShape as PagResShape, IntoProyecto } from "../model";

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
  getAll(): Proyecto[] {
    return [...this.store.values()];
  }
}

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
