import { MockApiClient } from "../clients";
import { MockApiProyecto } from "../clients/mock-api";
import { type Proyecto, type PaginateResponseShape as PagResShape, IntoProyecto } from "../model";

export class ProyectoRepository {
  async getAll(): Promise<PagResShape<Proyecto>> {
    const client = MockApiClient;
    const { data } = await client.get<PagResShape<MockApiProyecto>>("/proyectos");

    const items: Proyecto[] = [];
    for (const dto of data.items) {
      try {
        items.push(toProyecto(dto));
      } catch (err) {
        console.info(`proyecto descartado (id=${dto.id}):`, err, { dto });
      }
    }

    return { ...data, items };
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
});
