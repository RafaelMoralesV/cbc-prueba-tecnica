import type { Proyecto } from "../model";

export class ProyectoRepository {
  async getAll(): Promise<Array<Proyecto>> {
    return [
      {
        id: "P-0042",
        nombre: "Planta Solar Los Andes",
        titular: "Minera Andina S.A.",
        region: "Antofagasta",
        monto_musd: 125.5,
        fecha_ingreso: "2024-03-15",
        estado: "Aprobado",
      },
    ];
  }
}
