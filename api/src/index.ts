import express from "express";
import type { ErrorRequestHandler } from "express";
import { createProyectoService } from "./services";
import { BadRequestError, createProyectoController } from "./controllers";
import { apiKeyAuth } from "./middleware/api-key-auth";
import { ProyectoStore, SqliteProyectoStore } from "./store";
import { IngestaService } from "./services/ingesta.service";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("Falta la variable de entorno API_KEY");
  process.exit(1);
}

const INGESTA_AL_INICIAR = (process.env.INGEST_ON_START ?? "true") === "true";
const INTERVALO_INGESTA_MS = Number(process.env.INGEST_INTERVAL_MS ?? 0); // 0 = desactivado

const createApp = (store: ProyectoStore, ingesta: IngestaService) => {
  const app = express();
  app.use(express.json());

  const proyectosService = createProyectoService(store);
  const controller = createProyectoController(proyectosService);

  app.use(apiKeyAuth(API_KEY));
  app.use("/", controller);

  app.post("/ingesta", async (_req, res, next) => {
    try {
      res.json(await ingesta.run());
    } catch (err) {
      next(err);
    }
  });

  app.use((_req, res) => res.status(404).json({ message: "No encontrado" }));
  app.use(errorHandler);

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
  const store = new SqliteProyectoStore(); // Lee desde DB_PATH
  const ingesta = new IngestaService(store);

  if (INGESTA_AL_INICIAR) {
    try {
      console.info("ingesta inicial:", await ingesta.run());
    } catch (err) {
      console.error("la ingesta inicial falló, se sirven los datos existentes:", err);
    }
  }

  if (INTERVALO_INGESTA_MS > 0) {
    setInterval(() => {
      ingesta.run().catch((err) => console.error("ingesta periódica falló:", err));
    }, INTERVALO_INGESTA_MS).unref();
  }

  const app = createApp(store, ingesta);
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.info(`listening on ${port}`));
};

main().catch((err) => {
  console.error("fallo al iniciar:", err);
  process.exit(1);
});
