import { Proyecto } from "../model";
import { PaginateResponseShape } from "../model/response";
import { ProyectoRepository } from "../repo";

export const createProyectoService = (repo: ProyectoRepository) => {
  return {
    getAll: async (): Promise<PaginateResponseShape<Proyecto>> => {
      return await repo.getAll();
    },
  };
};
