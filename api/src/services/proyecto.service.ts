import { Proyecto } from "../model";
import { type ResumenRegion } from "../model/proyecto";
import { createPaginateResponse, PaginateResponseShape } from "../model/response";
import { ProyectoRepository, type GetAllFilters } from "../repo";

export const createProyectoService = (repo: ProyectoRepository) => {
  return {
    getAll: async ({ page = 1, page_size = 20, ...filters }: GetAllInput): Promise<PaginateResponseShape<Proyecto>> => {
      const proyectos = repo.getAll(filters);

      return createPaginateResponse(proyectos, page, page_size);
    },

    getResumenRegion: async (): Promise<Array<ResumenRegion>> => {
      return repo.getResumenRegion();
    },
  };
};

export type GetAllInput = GetAllFilters & {
  page: number | undefined;
  page_size: number | undefined;
};
