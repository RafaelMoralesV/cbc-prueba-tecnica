import express from "express";
import type { ErrorRequestHandler } from "express";
import { ProyectoRepository } from "./repo";
import { createProyectoService } from "./services";
import { BadRequestError, createProyectoController } from "./controllers";

const createApp = (proyectosRepo: ProyectoRepository) => {
  const app = express();
  app.use(express.json());

  const proyectosService = createProyectoService(proyectosRepo);
  const controller = createProyectoController(proyectosService);

  app.use("/proyectos", controller);

  app.use(errorHandler);

  app.use((_req, res) => {
    res.status(404).json({ message: "No encontrado" });
  });

  return app;
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof BadRequestError) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: "Error interno" });
};

const main = async () => {
  const proyectosRepo = new ProyectoRepository();
  await proyectosRepo.load(); // fail fast if upstream is down

  const app = createApp(proyectosRepo);
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.info(`listening on ${port}`));
};

main().catch((err) => {
  console.error("fallo al iniciar:", err);
  process.exit(1);
});
