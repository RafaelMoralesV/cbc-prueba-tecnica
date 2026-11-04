import { Proyecto } from "../model";
import { type ResumenRegion } from "../model/proyecto";
import { createPaginateResponse, PaginateResponseShape } from "../model/response";
import { ProyectoStore } from "../store";
import { Filtros } from "../store/proyecto.store";

export const createProyectoService = (store: ProyectoStore) => ({
  getAll: async ({ page = 1, page_size = 20, ...filtros }: GetAllInput): Promise<PaginateResponseShape<Proyecto>> => {
    const { items } = await store.find(filtros, { page, pageSize: page_size });
    return createPaginateResponse(items, page, page_size);
  },

  getResumenRegion: (): Promise<ResumenRegion[]> => store.resumenPorRegion(),
});

export type GetAllInput = Filtros & {
  page: number | undefined;
  page_size: number | undefined;
};
