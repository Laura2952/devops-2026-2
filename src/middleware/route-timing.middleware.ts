import { performance } from "node:perf_hooks";
import type { Request, Response, NextFunction } from "express";

export function routeTimingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = performance.now();

  res.on("finish", () => {
    const durationMs = performance.now() - start;
    console.log(
      `[route-timing] ${req.method} ${req.path} | ${res.statusCode} | ${durationMs.toFixed(2)} ms`,
    );
  });

  next();
}
