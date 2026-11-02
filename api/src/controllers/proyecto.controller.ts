import { Router } from "express";
import type { Request, Response } from "express";
import { createProyectoService } from "../services";
import type { Proyecto } from "../model";

export const createProyectoController = (
  service: ReturnType<typeof createProyectoService>,
) => {
  const router = Router();

  router.get("/", async (req: Request, res: Response) => {
    const proyectos: Array<Proyecto> = await service.getAll();

    res.json(proyectos);
  });

  return router;
};
