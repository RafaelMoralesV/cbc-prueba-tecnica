import { ProyectoRepository } from "../repo";

export const createProyectoService = (repo: ProyectoRepository) => {
  return {
    getAll: async () => {
      return await repo.getAll();
    },
  };
};
