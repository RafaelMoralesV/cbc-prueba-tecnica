import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { createProyectoService } from "../services";
import { parseIntParam } from ".";

export const createProyectoController = (service: ReturnType<typeof createProyectoService>) => {
  const router = Router();

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseIntParam("page", req.query.page);
      const pageSize = parseIntParam("page_size", req.query.page_size, { max: 100 });

      res.json(await service.getAll(page, pageSize));
    } catch (err) {
      next(err);
    }
  });

  return router;
};
