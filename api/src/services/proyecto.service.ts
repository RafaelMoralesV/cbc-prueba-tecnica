import { Proyecto } from "../model";
import { createPaginateResponse, PaginateResponseShape } from "../model/response";
import { ProyectoRepository } from "../repo";

export const createProyectoService = (repo: ProyectoRepository) => {
  return {
    getAll: async (page: number = 1, page_size: number = 20): Promise<PaginateResponseShape<Proyecto>> => {
      const proyectos = repo.getAll();

      return createPaginateResponse(proyectos, page, page_size);
    },
  };
};
