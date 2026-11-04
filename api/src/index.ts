import express from "express";
import type { ErrorRequestHandler } from "express";
import { ProyectoRepository } from "./repo";
import { createProyectoService } from "./services";
import { createProyectoController } from "./controllers";

const createApp = () => {
  const app = express();
  app.use(express.json());

  const proyectosRepo = new ProyectoRepository();
  const proyectosService = createProyectoService(proyectosRepo);

  app.use("/proyectos", createProyectoController(proyectosService));

  app.use(errorHandler);

  app.use((_req, res) => {
    res.status(404).json({ message: "No encontrado" });
  });

  return app;
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // TODO: En verdaderos errores deberia entregar error 500.
  console.error(err);
  return res.status(500).json({ message: "Error interno" });
};

const port = process.env.PORT || 3000;

createApp().listen(port);
