import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { CreateClientException } from ".";

const MAX_REINTENTOS = 3;
const DELAY_BASE_MS = 500;
const DELAY_MAXIMO_MS = 30_000;
const TIEMPO_RETRY_DEFAULT_SEG = 5;
const TIEMPO_MAXIMO_RETRY_AFTER_SEG = 60;

type ConfigConRetry = InternalAxiosRequestConfig & { contador_retry?: number };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/// Para errores 500 entregamos un delay en tiempo aleatoreo
const delayRetryRandom = (num_intento: number): number => {
  const exp = Math.min(DELAY_MAXIMO_MS, DELAY_BASE_MS * 2 ** num_intento);
  return exp * (0.5 + Math.random() * 0.5);
};

/// Para errores 429 reintentamos segun lo que nos diga el header
const retryDespuesDeDelay = (header: unknown): number => {
  let segundos = TIEMPO_RETRY_DEFAULT_SEG;

  if (header !== undefined && header !== null && header !== "") {
    const num = Number(header);
    if (Number.isFinite(num)) {
      segundos = num;
    }
  }

  segundos = Math.max(segundos, 0.5);
  segundos = Math.min(segundos, TIEMPO_MAXIMO_RETRY_AFTER_SEG);
  return segundos * 1_000;
};

const createClient = (base_url: string, api_key: string) => {
  if (!base_url) {
    throw new CreateClientException("Base URL debe ser provista");
  }

  const client: AxiosInstance = axios.create({
    baseURL: base_url,
    timeout: 10_000,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });

  // Utiliza API key
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (!!api_key) {
        config.headers["X-API-Key"] = api_key;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as ConfigConRetry | undefined;
      const status = error.response?.status;

      const reintentable = !error.response || status === 429 || (status !== undefined && status >= 500);
      if (!config || reintentable) {
        return Promise.reject(error);
      }

      const intento = config.contador_retry ?? 0;
      if (intento >= MAX_REINTENTOS) {
        return Promise.reject(error);
      }

      config.contador_retry = intento + 1;

      const delay =
        status === 429 ? retryDespuesDeDelay(error.response?.headers?.["retry-after"]) : delayRetryRandom(intento);

      await sleep(delay);

      return client.request(config);
    },
  );

  return client;
};

/// Instancia especifica del API provista por CBC.
export const MockApiClient = createClient(
  process.env.SOURCE_BASE_URL ?? "http://localhost:8001",
  process.env.SOURCE_API_KEY ?? "dev-source-key",
);

export type MockApiProyecto = {
  id: string;
  nombre: string;
  titular: string;
  region: string;
  monto: string;
  fecha_ingreso: string;
  estado: string;
  actualizado_en: string;
};
