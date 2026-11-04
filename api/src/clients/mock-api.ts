import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { CreateClientException } from ".";

const createClient = (base_url: string, api_key: string) => {
  if (!base_url) {
    throw new CreateClientException("Base URL debe ser provista");
  }

  const client: AxiosInstance = axios.create({
    baseURL: base_url,
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
    (error: AxiosError) => {
      return error;
    },
  );

  return client;
};

/// Instancia especifica del API provista por CBC.
export const MockApiClient = createClient(
  process.env.MOCK_API_URL ?? "http://localhost:8001/api/v1",
  process.env.MOCK_API_KEY ?? "dev-source-key",
);

export type MockApiProyecto = {
  id: string;
  nombre: string;
  titular: string;
  region: string;
  monto: number;
  fecha_ingreso: string;
  estado: string;
};
