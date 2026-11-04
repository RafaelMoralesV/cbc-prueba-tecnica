import { MockApiClient } from "../clients";
import type { Proyecto, PaginateResponseShape } from "../model";

export class ProyectoRepository {
  async getAll(): Promise<PaginateResponseShape<Proyecto>> {
    const client = MockApiClient;
    const res = await client.get<PaginateResponseShape<Proyecto>>("/proyectos");

    console.debug(res);

    return res.data;
  }
}
