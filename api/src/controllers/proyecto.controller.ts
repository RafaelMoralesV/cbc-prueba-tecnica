import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { createProyectoService } from "../services";
import { parseIntParam, parseNumberParam, parseStringParam } from ".";

export const createProyectoController = (service: ReturnType<typeof createProyectoService>) => {
  const router = Router();

  router.get("/proyectos", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const region = parseStringParam("region", req.query.region);
      const estado = parseStringParam("estado", req.query.estado);
      const monto_minimo = parseNumberParam("monto_minimo", req.query.monto_minimo);

      const page = parseIntParam("page", req.query.page);
      const page_size = parseIntParam("page_size", req.query.page_size, { max: 100 });

      res.json(await service.getAll({ page, page_size, region, estado, monto_minimo }));
    } catch (err) {
      next(err);
    }
  });

  router.get("/resumen", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.getResumenRegion());
    } catch (err) {
      next(err);
    }
  });

  return router;
};
