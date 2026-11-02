import { Estado } from "./index";

export type Proyecto = {
  id: string;
  nombre: string;
  titular: string;
  region: string;
  monto_musd: number;
  fecha_ingreso: string;
  estado: Estado;
};
