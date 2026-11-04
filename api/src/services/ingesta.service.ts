import { mkdir, writeFile } from "node:fs/promises";
import { MockApiClient, MockApiProyecto } from "../clients/mock-api";
import { IntoProyecto, type Proyecto, type PaginateResponseShape as PagResShape } from "../model";
import { ProyectoStore } from "../store";
import path from "node:path";

const PAGE_SIZE = 50;
const DIR_DESCARTADOS = process.env.DIR_DESCARTADOS ?? "./output";
const ARCHIVO_DESCARTADOS = "proyectos_descartados.csv";

// services/ingesta-service.ts
export class IngestaService {
  constructor(private store: ProyectoStore) {}

  private async writeDescartados(descartados: Descartado[]): Promise<void> {
    try {
      await mkdir(DIR_DESCARTADOS, { recursive: true });
      const filePath = path.join(DIR_DESCARTADOS, ARCHIVO_DESCARTADOS);

      const csvCell = (value: unknown): string => {
        const s = value === null || value === undefined ? "" : String(value);
        return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const lines = ["id,nombre,motivo", ...descartados.map((d) => [d.id, d.nombre, d.motivo].map(csvCell).join(","))];

      await writeFile(filePath, lines.join("\n") + "\n", "utf8");
      console.info(`${descartados.length} proyectos descartados escritos en ${filePath}`);
    } catch (err) {
      console.error("no se pudo escribir el CSV de descartados:", err);
    }
  }

  private async fetchPage(page: number): Promise<PagResShape<MockApiProyecto>> {
    const { data } = await MockApiClient.get<PagResShape<MockApiProyecto>>("/api/v1/proyectos", {
      params: { page, page_size: PAGE_SIZE },
    });
    return data;
  }

  private async fetchAll(): Promise<MockApiProyecto[]> {
    const first = await this.fetchPage(1);
    const items = [...first.items];

    for (let page = 2; page <= first.total_pages; page++) {
      const res = await this.fetchPage(page);
      items.push(...res.items);
    }

    if (items.length !== first.total_items) {
      console.warn(`esperaba ${first.total_items} items, recibí ${items.length}`);
    }
    return items;
  }

  async run() {
    const dtos = await this.fetchAll();
    const validos: Proyecto[] = [];
    const descartados: Descartado[] = [];

    for (const dto of dtos) {
      try {
        validos.push(toProyecto(dto));
      } catch (err) {
        descartados.push({ id: dto.id, nombre: dto.nombre, motivo: err instanceof Error ? err.message : String(err) });
      }
    }

    const cambios = await this.store.upsertMany(validos);
    await this.writeDescartados(descartados);
    return { recibidos: dtos.length, validos: validos.length, descartados: descartados.length, cambios };
  }
}

type Descartado = { id: unknown; nombre: unknown; motivo: string };

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
