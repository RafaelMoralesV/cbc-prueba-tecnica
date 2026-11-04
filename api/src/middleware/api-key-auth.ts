import { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "crypto";

const comparar = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

export const apiKeyAuth = (apiKeyEsperada: string) => (req: Request, res: Response, next: NextFunction) => {
  const recibida = req.header("X-API-Key");

  if (!recibida || !comparar(recibida, apiKeyEsperada)) {
    return res.status(401).json({ error: "API key ausente o inválida" });
  }

  next();
};
