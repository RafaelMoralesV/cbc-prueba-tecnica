import { Router } from "express";
import type { Request, Response } from "express";
import { createProyectoService } from "../services";
import type { PaginateResponseShape, Proyecto } from "../model";

export const createProyectoController = (
  service: ReturnType<typeof createProyectoService>,
) => {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    const proyectos: PaginateResponseShape<Proyecto> = await service.getAll();

    res.json(proyectos);
  });

  return router;
};
